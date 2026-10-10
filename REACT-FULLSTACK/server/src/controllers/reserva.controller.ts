import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { reservaService } from '../services/reserva.service';
import { logger } from '../utils/logger';
import { EstadoReserva } from '@prisma/client';

/* GET /api/reservas?pacienteId=&odontologoId=&estado= */
export const getReservas = asyncHandler(async (req: Request, res: Response) => {
  const pacienteId = req.user?.rol === 'PACIENTE'
    ? req.user.personaId
    : req.query.pacienteId ? parseInt(req.query.pacienteId as string) : undefined;

  const odontologoId = req.query.odontologoId ? parseInt(req.query.odontologoId as string) : undefined;
  const estado = req.query.estado as EstadoReserva | undefined;

  const reservas = await reservaService.getAll(pacienteId, odontologoId, estado);
  logger.debug('Reservas obtenidas', { cantidad: reservas.length, pacienteId, odontologoId, estado });

  res.json({
    success: true,
    data: reservas,
    total: reservas.length,
  });
});

/* GET /api/reservas/:id */
export const getReservaById = asyncHandler(async (req: Request, res: Response) => {
  const reservaId = parseInt(req.params.id as string);

  const reserva = await reservaService.getByIdOrThrow(reservaId);
  logger.debug('Reserva encontrada', { reservaId });

  res.json({
    success: true,
    data: reserva,
  });
});

/* POST /api/reservas (CUU 1: reservar turno) */
export const createReserva = asyncHandler(async (req: Request, res: Response) => {
  logger.info('Intentando crear reserva', { turno_codigo: req.body.turno_codigo, paciente_id: req.body.paciente_id });

  if (!req.user) {
    res.status(401).json({ error: 'No estas logueado' });
    return;
  }

  if (req.user.rol === 'PACIENTE' && req.user.personaId !== parseInt(req.body.paciente_id)) {
    res.status(403).json({ error: 'Solo podés reservar para vos mismo' });
    return;
  }

  const nuevaReserva = await reservaService.createReservaTurno(req.body);
  logger.info('Reserva creada exitosamente', { reservaId: nuevaReserva?.id_reserva });

  res.status(201).json({
    success: true,
    message: 'Reserva registrada exitosamente',
    data: nuevaReserva,
  });
});

/* PATCH /api/reservas/:id/cancelar */
export const cancelarReserva = asyncHandler(async (req: Request, res: Response) => {
  const reservaId = parseInt(req.params.id as string);
  const motivo = req.body?.motivo as string | undefined;

  const reservaCancelada = await reservaService.cancelarReserva(reservaId, motivo);
  logger.info('Reserva cancelada exitosamente', { reservaId, motivo });

  res.json({
    success: true,
    message: 'Reserva cancelada exitosamente',
    data: reservaCancelada,
  });
});

/* PATCH /api/reservas/:id/finalizar */
export const finalizarReserva = asyncHandler(async (req: Request, res: Response) => {
  const reservaId = parseInt(req.params.id as string);

  const reservaFinalizada = await reservaService.finalizarReserva(reservaId, req.body);
  logger.info('Reserva finalizada exitosamente', { reservaId });

  res.json({
    success: true,
    message: 'Reserva finalizada exitosamente',
    data: reservaFinalizada,
  });
});