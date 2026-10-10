import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { turnoService } from '../services/turno.service';
import { logger } from '../utils/logger';

/* GET /api/turnos?odontologoId=&estado= */
export const getTurnos = asyncHandler(async (req: Request, res: Response) => {
  let odontologoId = req.query.odontologoId ? parseInt(req.query.odontologoId as string) : undefined;
  // Si es ODONTOLOGO, solo puede ver sus propios turnos
  if (req.user?.rol === 'ODONTOLOGO') {
    odontologoId = req.user.personaId;
  }
  const estado = req.query.estado as string | undefined;

  const turnos = await turnoService.getAll(odontologoId, estado);
  logger.debug('Turnos obtenidos', { cantidad: turnos.length, odontologoId, estado });

  res.json({
    success: true,
    data: turnos,
    total: turnos.length,
  });
});

/* GET /api/turnos/disponibles?odontologoId=&fecha=YYYY-MM-DD */
export const getTurnosDisponibles = asyncHandler(async (req: Request, res: Response) => {
  const odontologoId = req.query.odontologoId ? parseInt(req.query.odontologoId as string) : undefined;
  const fecha = req.query.fecha as string | undefined;

  const turnos = await turnoService.getDisponibles(odontologoId, fecha);
  logger.debug('Turnos disponibles obtenidos', { cantidad: turnos.length, odontologoId, fecha });

  res.json({
    success: true,
    data: turnos,
    total: turnos.length,
  });
});

/* GET /api/turnos/:codigo */
export const getTurnoById = asyncHandler(async (req: Request, res: Response) => {
  const codigo = parseInt(req.params.codigo as string);

  const turno = await turnoService.getByIdOrThrow(codigo);
  logger.debug('Turno encontrado', { codigo });

  res.json({
    success: true,
    data: turno,
  });
});

/* POST /api/turnos */
export const createTurno = asyncHandler(async (req: Request, res: Response) => {
  // Si es ODONTOLOGO, solo puede crear turnos para sí mismo
  if (req.user?.rol === 'ODONTOLOGO') {
    req.body.odontologo_id = req.user.personaId;
  }

  logger.info('Intentando crear turno', { odontologoId: req.body.odontologo_id });

  const nuevoTurno = await turnoService.create(req.body);
  logger.info('Turno creado exitosamente', { codigo: nuevoTurno.codigo });

  res.status(201).json({
    success: true,
    message: 'Turno registrado exitosamente',
    data: nuevoTurno,
  });
});

/* PUT /api/turnos/:codigo */
export const updateTurno = asyncHandler(async (req: Request, res: Response) => {
  const codigo = parseInt(req.params.codigo as string);

  const turnoActualizado = await turnoService.update(codigo, req.body);
  logger.info('Turno actualizado exitosamente', { codigo, cambios: Object.keys(req.body) });

  res.json({
    success: true,
    message: 'Turno actualizado exitosamente',
    data: turnoActualizado,
  });
});

/* DELETE /api/turnos/:codigo */
export const deleteTurno = asyncHandler(async (req: Request, res: Response) => {
  const codigo = parseInt(req.params.codigo as string);

  // Si es ODONTOLOGO, verificar que el turno le pertenece
  if (req.user?.rol === 'ODONTOLOGO') {
    const turno = await turnoService.getByIdOrThrow(codigo);
    if (turno.odontologo_id !== req.user.personaId) {
      res.status(403).json({ error: 'Solo podés eliminar tus propios turnos.' });
      return;
    }
  }

  await turnoService.delete(codigo);
  logger.info('Turno eliminado exitosamente', { codigo });

  res.status(204).send();
});