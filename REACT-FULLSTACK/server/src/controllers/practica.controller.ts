import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { practicaService } from '../services/practica.service';
import { logger } from '../utils/logger';

/* GET /api/practicas */
export const getPracticas = asyncHandler(async (req: Request, res: Response) => {
  const practicas = await practicaService.getAll();
  logger.debug('Prácticas obtenidas', { cantidad: practicas.length });

  res.json({
    success: true,
    data: practicas,
    total: practicas.length,
  });
});

/* GET /api/practicas/:id */
export const getPracticaById = asyncHandler(async (req: Request, res: Response) => {
  const practicaId = parseInt(req.params.id as string);

  const practica = await practicaService.getByIdOrThrow(practicaId);
  logger.debug('Práctica encontrada', { practicaId });

  res.json({
    success: true,
    data: practica,
  });
});

/* POST /api/practicas */
export const createPractica = asyncHandler(async (req: Request, res: Response) => {
  logger.info('Intentando crear práctica', { codigo: req.body.codigo });

  const nuevaPractica = await practicaService.create(req.body);
  logger.info('Práctica creada exitosamente', { practicaId: nuevaPractica.id, codigo: req.body.codigo });

  res.status(201).json({
    success: true,
    message: 'Práctica registrada exitosamente',
    data: nuevaPractica,
  });
});

/* PUT /api/practicas/:id */
export const updatePractica = asyncHandler(async (req: Request, res: Response) => {
  const practicaId = parseInt(req.params.id as string);

  const practicaActualizada = await practicaService.update(practicaId, req.body);
  logger.info('Práctica actualizada exitosamente', { practicaId, cambios: Object.keys(req.body) });

  res.json({
    success: true,
    message: 'Práctica actualizada exitosamente',
    data: practicaActualizada,
  });
});

/* DELETE /api/practicas/:id */
export const deletePractica = asyncHandler(async (req: Request, res: Response) => {
  const practicaId = parseInt(req.params.id as string);

  await practicaService.delete(practicaId);
  logger.info('Práctica eliminada exitosamente', { practicaId });

  res.status(204).send();
});