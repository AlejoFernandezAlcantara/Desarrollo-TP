import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { dienteService } from '../services/diente.service';
import { logger } from '../utils/logger';

/* GET /api/dientes */
export const getDientes = asyncHandler(async (req: Request, res: Response) => {
  const dientes = await dienteService.getAll();
  logger.debug('Dientes obtenidos', { cantidad: dientes.length });

  res.json({
    success: true,
    data: dientes,
    total: dientes.length,
  });
});

/* GET /api/dientes/:id */
export const getDienteById = asyncHandler(async (req: Request, res: Response) => {
  const dienteId = parseInt(req.params.id as string);

  const diente = await dienteService.getByIdOrThrow(dienteId);
  logger.debug('Diente encontrado', { dienteId });

  res.json({
    success: true,
    data: diente,
  });
});

/* POST /api/dientes */
export const createDiente = asyncHandler(async (req: Request, res: Response) => {
  logger.info('Intentando crear diente', { numero: req.body.numero });

  const nuevoDiente = await dienteService.create(req.body);
  logger.info('Diente creado exitosamente', { dienteId: nuevoDiente.id, numero: req.body.numero });

  res.status(201).json({
    success: true,
    message: 'Diente registrado exitosamente',
    data: nuevoDiente,
  });
});

/* PUT /api/dientes/:id */
export const updateDiente = asyncHandler(async (req: Request, res: Response) => {
  const dienteId = parseInt(req.params.id as string);

  const dienteActualizado = await dienteService.update(dienteId, req.body);
  logger.info('Diente actualizado exitosamente', { dienteId, cambios: Object.keys(req.body) });

  res.json({
    success: true,
    message: 'Diente actualizado exitosamente',
    data: dienteActualizado,
  });
});

/* DELETE /api/dientes/:id */
export const deleteDiente = asyncHandler(async (req: Request, res: Response) => {
  const dienteId = parseInt(req.params.id as string);

  await dienteService.delete(dienteId);
  logger.info('Diente eliminado exitosamente', { dienteId });

  res.status(204).send();
});