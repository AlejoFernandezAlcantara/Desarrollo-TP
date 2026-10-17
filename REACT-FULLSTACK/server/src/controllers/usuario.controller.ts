import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import * as usuarioService from '../services/usuario.service';
import { logger } from '../utils/logger';

/* GET /api/usuarios */
export const getAllUsuarios = asyncHandler(async (req: Request, res: Response) => {
  const usuarios = await usuarioService.getAll();
  logger.debug('Usuarios obtenidos', { cantidad: usuarios.length });

  res.json({
    success: true,
    data: usuarios,
    total: usuarios.length,
  });
});

/* GET /api/usuarios/:id */
export const getUsuarioById = asyncHandler(async (req: Request, res: Response) => {
  const usuarioId = parseInt(req.params.id as string);

  const usuario = await usuarioService.getByIdOrThrow(usuarioId);
  logger.debug('Usuario encontrado', { usuarioId });

  res.json({
    success: true,
    data: usuario,
  });
});

/* POST /api/usuarios */
export const createUsuario = asyncHandler(async (req: Request, res: Response) => {
  logger.info('Intentando crear usuario', { email: req.body.email });

  const nuevoUsuario = await usuarioService.create(req.body);
  logger.info('Usuario creado exitosamente', { usuarioId: nuevoUsuario?.id, email: req.body.email });

  res.status(201).json({
    success: true,
    message: 'Usuario registrado exitosamente',
    data: nuevoUsuario,
  });
});

/* PUT /api/usuarios/:id */
export const updateUsuario = asyncHandler(async (req: Request, res: Response) => {
  const usuarioId = parseInt(req.params.id as string);

  const usuarioActualizado = await usuarioService.update(usuarioId, req.body);
  logger.info('Usuario actualizado exitosamente', { usuarioId, cambios: Object.keys(req.body) });

  res.json({
    success: true,
    message: 'Usuario actualizado exitosamente',
    data: usuarioActualizado,
  });
});

/* DELETE /api/usuarios/:id */
export const deleteUsuario = asyncHandler(async (req: Request, res: Response) => {
  const usuarioId = parseInt(req.params.id as string);

  await usuarioService.remove(usuarioId);
  logger.info('Usuario eliminado exitosamente', { usuarioId });

  res.status(204).send();
});