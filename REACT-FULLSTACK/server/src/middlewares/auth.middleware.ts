import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type UserRole = 'ADMINISTRADOR' | 'ODONTOLOGO' | 'PACIENTE';

export interface AuthPayload {
  id: number;
  email: string;
  rol: UserRole;
  personaId?: number; // ID en paciente u odontologo si aplica
}

/**
 * Obtiene el token desde la cookie HttpOnly 'token' o desde el header 'Authorization: Bearer <token>'
 */
const extraerToken = (req: Request): string | undefined => {
  const desdeCookie = req.cookies?.token;
  if (desdeCookie) return desdeCookie;

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7).trim() || undefined;
  }

  return undefined;
};

/**
 * Middleware para autenticar requests mediante JWT
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = extraerToken(req);

  if (!token) {
    res.status(401).json({ error: 'Acceso no autorizado. Token de sesión no proporcionado.' });
    return;
  }

  try {
   req.user = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado. Inicia sesión nuevamente.' });
    return;
  }

  // next() va fuera del try: si un handler posterior lanza un error síncrono,
  // no debe caer en el catch del token y responder un 401 equivocado.
  next();
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
        error: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}. Tu rol actual es: ${req.user.rol}`,
      });
      return;
    }

    next();
  };
};
