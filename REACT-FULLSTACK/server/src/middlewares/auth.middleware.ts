import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_consultorio_2026';

export type UserRole = 'ADMINISTRADOR' | 'ODONTOLOGO' | 'PACIENTE';

export interface AuthPayload {
  id: number;
  email: string;
  rol: UserRole;
  personaId?: number; // ID en paciente u odontologo si aplica
}

// Extender el tipo Request de Express
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Middleware para autenticar requests a través de JWT (Cookie HttpOnly o Bearer Header)
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  // 1. Prioridad: Cookie HttpOnly 'token'
  let token = req.cookies?.token;

  // 2. Alternativa: Header Authorization 'Bearer <token>'
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Acceso no autorizado. Token de sesión no proporcionado.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido o expirado. Inicia sesión nuevamente.' });
  }
};

/**
 * Middleware para restringir acceso según roles permitidos
 */
export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    if (!roles.includes(req.user.rol)) {
      res.status(403).json({ 
        error: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}. Tu rol actual es: ${req.user.rol}` 
      });
      return;
    }

    next();
  };
};
