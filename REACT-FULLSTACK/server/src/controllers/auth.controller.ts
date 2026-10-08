import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';

const isProduction = process.env.NODE_ENV === 'production';
const TOKEN_MAX_AGE = 24 * 60 * 60 * 1000; // 24 horas

const cookieBase = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
};

/* POST /api/auth/login */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { token, usuario } = await authService.login(req.body.email, req.body.password);

  res.cookie('token', token, { ...cookieBase, maxAge: TOKEN_MAX_AGE });
  logger.info('Inicio de sesión exitoso', { usuarioId: usuario.id, rol: usuario.rol });

  res.json({
    mensaje: 'Inicio de sesión exitoso',
    usuario,
  });
});

/* POST /api/auth/logout */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie('token', cookieBase);
  logger.info('Sesión cerrada', { usuarioId: req.user?.id });

  res.json({ mensaje: 'Sesión cerrada exitosamente' });
});

/* GET /api/auth/me */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const usuario = await authService.getMe(req.user.id);
  res.json({ usuario });
});

/* POST /api/auth/register */
export const registerPaciente = asyncHandler(async (req: Request, res: Response) => {
  logger.info('Intentando registrar paciente', { email: req.body.email });

  const { token, usuario } = await authService.registerPaciente(req.body);

  res.cookie('token', token, { ...cookieBase, maxAge: TOKEN_MAX_AGE });
  logger.info('Paciente registrado exitosamente', { usuarioId: usuario.id, email: usuario.email });

  res.status(201).json({
    mensaje: 'Paciente registrado exitosamente',
    usuario,
  });
});