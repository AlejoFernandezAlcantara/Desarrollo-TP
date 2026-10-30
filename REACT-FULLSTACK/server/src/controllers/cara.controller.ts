import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { caraService } from '../services/cara.service';
import { logger } from '../utils/logger';

/* GET /api/caras */
export const getCaras = asyncHandler(async (req: Request, res: Response) => {
  const caras = await caraService.getAll();
  logger.debug('Caras obtenidas', { cantidad: caras.length });

  res.json({
    success: true,
    data: caras,
    total: caras.length,
  });
});

/* GET /api/caras/:id */
export const getCaraById = asyncHandler(async (req: Request, res: Response) => {
  const caraId = parseInt(req.params.id as string);

  const cara = await caraService.getByIdOrThrow(caraId);
  logger.debug('Cara encontrada', { caraId });

  res.json({
    success: true,
    data: cara,
  });
});

/* POST /api/caras */
export const createCara = asyncHandler(async (req: Request, res: Response) => {
  logger.info('Intentando crear cara', { nombre: req.body.nombre });

  const nuevaCara = await caraService.create(req.body);
  logger.info('Cara creada exitosamente', { caraId: nuevaCara.id, nombre: req.body.nombre });

  res.status(201).json({
    success: true,
    message: 'Cara registrada exitosamente',
    data: nuevaCara,
  });
});

/* PUT /api/caras/:id */
export const updateCara = asyncHandler(async (req: Request, res: Response) => {
  const caraId = parseInt(req.params.id as string);

  const caraActualizada = await caraService.update(caraId, req.body);
  logger.info('Cara actualizada exitosamente', { caraId, cambios: Object.keys(req.body) });

  res.json({
    success: true,
    message: 'Cara actualizada exitosamente',
    data: caraActualizada,
  });
});

/* DELETE /api/caras/:id */
export const deleteCara = asyncHandler(async (req: Request, res: Response) => {
  const caraId = parseInt(req.params.id as string);

  await caraService.delete(caraId);
  logger.info('Cara eliminada exitosamente', { caraId });

  res.status(204).send();
});

/* POST /api/caras/diente/:dienteId/:caraId */
export const linkCaraToDiente = asyncHandler(async (req: Request, res: Response) => {
  const dienteId = parseInt(req.params.dienteId as string);
  const caraId = parseInt(req.params.caraId as string);

  const vinculo = await caraService.linkToDiente(dienteId, caraId);
  logger.info('Cara vinculada a diente', { dienteId, caraId });

  res.status(201).json({
    success: true,
    message: 'Cara vinculada al diente',
    data: vinculo,
  });
});

/* DELETE /api/caras/diente/:dienteId/:caraId */
export const unlinkCaraFromDiente = asyncHandler(async (req: Request, res: Response) => {
  const dienteId = parseInt(req.params.dienteId as string);
  const caraId = parseInt(req.params.caraId as string);

  await caraService.unlinkFromDiente(dienteId, caraId);
  logger.info('Cara desvinculada del diente', { dienteId, caraId });

  res.status(204).send();
});

/* GET /api/caras/diente/:dienteId */
export const getCarasByDiente = asyncHandler(async (req: Request, res: Response) => {
  const dienteId = parseInt(req.params.dienteId as string);

  const caras = await caraService.getCarasByDiente(dienteId);
  logger.debug('Caras del diente obtenidas', { dienteId, cantidad: caras.length });

  res.json({
    success: true,
    data: caras,
    total: caras.length,
  });
});