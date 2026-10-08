import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { detalleService } from '../services/detalle.service';
import { logger } from '../utils/logger';

/* GET /api/detalles?reservaId=&odontogramaId= */
export const getDetalles = asyncHandler(async (req: Request, res: Response) => {
  const reservaId = req.query.reservaId ? parseInt(req.query.reservaId as string) : undefined;
  const odontogramaId = req.query.odontogramaId ? parseInt(req.query.odontogramaId as string) : undefined;

  const detalles = await detalleService.getAll(reservaId, odontogramaId);
  logger.debug('Detalles obtenidos', { cantidad: detalles.length, reservaId, odontogramaId });

  res.json({
    success: true,
    data: detalles,
    total: detalles.length,
  });
});

/* GET /api/detalles/:id */
export const getDetalleById = asyncHandler(async (req: Request, res: Response) => {
  const detalleId = parseInt(req.params.id as string);

  const detalle = await detalleService.getByIdOrThrow(detalleId);
  logger.debug('Detalle encontrado', { detalleId });

  res.json({
    success: true,
    data: detalle,
  });
});

/* POST /api/detalles (CUU 2: registrar práctica realizada) */
export const createDetalle = asyncHandler(async (req: Request, res: Response) => {
  logger.info('Intentando registrar práctica realizada', {
    reservaId: req.body.reserva_id,
    practicaId: req.body.practica_id,
  });

  const nuevoDetalle = await detalleService.create(req.body);
  logger.info('Práctica realizada registrada exitosamente', { detalleId: nuevoDetalle.id });

  res.status(201).json({
    success: true,
    message: 'Práctica realizada registrada exitosamente',
    data: nuevoDetalle,
  });
});

/* DELETE /api/detalles/:id */
export const deleteDetalle = asyncHandler(async (req: Request, res: Response) => {
  const detalleId = parseInt(req.params.id as string);

  await detalleService.delete(detalleId);
  logger.info('Detalle eliminado exitosamente', { detalleId });

  res.status(204).send();
});
