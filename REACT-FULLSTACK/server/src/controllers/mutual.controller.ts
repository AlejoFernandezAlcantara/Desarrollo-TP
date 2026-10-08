import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { mutualService } from '../services/mutual.service';
import { logger } from '../utils/logger';

/* GET /api/mutuales */
export const getMutuales = asyncHandler(async (req: Request, res: Response) => {
  const mutuales = await mutualService.getAll();
  logger.debug('Mutuales obtenidas', { cantidad: mutuales.length });

  res.json({
    success: true,
    data: mutuales,
    total: mutuales.length,
  });
});

/* GET /api/mutuales/:id */
export const getMutualById = asyncHandler(async (req: Request, res: Response) => {
  const mutualId = parseInt(req.params.id as string);

  const mutual = await mutualService.getByIdOrThrow(mutualId);
  logger.debug('Mutual encontrada', { mutualId });

  res.json({
    success: true,
    data: mutual,
  });
});

/* POST /api/mutuales */
export const createMutual = asyncHandler(async (req: Request, res: Response) => {
  logger.info('Intentando crear mutual', { cuit: req.body.cuit });

  const nuevaMutual = await mutualService.create(req.body);
  logger.info('Mutual creada exitosamente', { mutualId: nuevaMutual.id, cuit: req.body.cuit });

  res.status(201).json({
    success: true,
    message: 'Mutual registrada exitosamente',
    data: nuevaMutual,
  });
});

/* PUT /api/mutuales/:id */
export const updateMutual = asyncHandler(async (req: Request, res: Response) => {
  const mutualId = parseInt(req.params.id as string);

  const mutualActualizada = await mutualService.update(mutualId, req.body);
  logger.info('Mutual actualizada exitosamente', { mutualId, cambios: Object.keys(req.body) });

  res.json({
    success: true,
    message: 'Mutual actualizada exitosamente',
    data: mutualActualizada,
  });
});

/* DELETE /api/mutuales/:id */
export const deleteMutual = asyncHandler(async (req: Request, res: Response) => {
  const mutualId = parseInt(req.params.id as string);

  await mutualService.delete(mutualId);
  logger.info('Mutual eliminada exitosamente', { mutualId });

  res.status(204).send();
});