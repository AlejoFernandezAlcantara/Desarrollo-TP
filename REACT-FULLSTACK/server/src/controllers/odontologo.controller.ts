import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { odontologoService } from '../services/odontologo.service';
import { logger } from '../utils/logger';

/* GET /api/odontologos?mutualId= */
export const getOdontologos = asyncHandler(async (req: Request, res: Response) => {
  const mutualId = req.query.mutualId ? parseInt(req.query.mutualId as string) : undefined;

  const odontologos = await odontologoService.getAll(mutualId);
  logger.debug('Odontólogos obtenidos', { cantidad: odontologos.length, mutualId });

  res.json({
    success: true,
    data: odontologos,
    total: odontologos.length,
  });
});

/* POST /api/odontologos/:id/mutuales */
export const addMutualToOdontologo = asyncHandler(async (req: Request, res: Response) => {
  const { id, mutualId } = req.params as { id: string; mutualId: string };
  const { nroAfiliado } = req.body;
  const odontologoId = parseInt(id);
  const mutId = parseInt(mutualId);

  const vinculo = await odontologoService.addMutual(odontologoId, {
    mutual_id: mutId,
    nroAfiliado,
  });
  logger.info('Mutual asociada al odontólogo', { odontologoId, mutualId: mutId });

  res.status(201).json({
    success: true,
    message: 'Mutual asociada al odontólogo',
    data: vinculo,
  });
});

/* GET /api/odontologos/:id */
export const getOdontologoById = asyncHandler(async (req: Request, res: Response) => {
  const odontologoId = parseInt(req.params.id as string);

  const odontologo = await odontologoService.getByIdOrThrow(odontologoId);
  logger.debug('Odontólogo encontrado', { odontologoId });

  res.json({
    success: true,
    data: odontologo,
  });
});

/* POST /api/odontologos */
export const createOdontologo = asyncHandler(async (req: Request, res: Response) => {
  logger.info('Intentando crear odontólogo', { email: req.body.email });

  const nuevoOdontologo = await odontologoService.create(req.body);
  logger.info('Odontólogo creado exitosamente', { odontologoId: nuevoOdontologo.id, email: req.body.email });

  res.status(201).json({
    success: true,
    message: 'Odontólogo registrado exitosamente',
    data: nuevoOdontologo,
  });
});

/* PUT /api/odontologos/:id */
export const updateOdontologo = asyncHandler(async (req: Request, res: Response) => {
  const odontologoId = parseInt(req.params.id as string);

  const odontologoActualizado = await odontologoService.update(odontologoId, req.body);
  logger.info('Odontólogo actualizado exitosamente', { odontologoId, cambios: Object.keys(req.body) });

  res.json({
    success: true,
    message: 'Odontólogo actualizado exitosamente',
    data: odontologoActualizado,
  });
});

/* DELETE /api/odontologos/:id */
export const deleteOdontologo = asyncHandler(async (req: Request, res: Response) => {
  const odontologoId = parseInt(req.params.id as string);

  await odontologoService.delete(odontologoId);
  logger.info('Odontólogo eliminado exitosamente', { odontologoId });

  res.status(204).send();
});

/* DELETE /api/odontologos/:id/mutuales/:mutualId */
export const removeMutualFromOdontologo = asyncHandler(async (req: Request, res: Response) => {
  const { id, mutualId } = req.params as { id: string; mutualId: string };
  const odontologoId = parseInt(id);
  const mutId = parseInt(mutualId);

  await odontologoService.removeMutual(odontologoId, mutId);
  logger.info('Mutual desasociada del odontólogo', { odontologoId, mutualId: mutId });

  res.status(204).send();
});