import { Request, Response } from 'express';
import { reservaService } from '../services/reserva.service';
import { EstadoReserva } from '@prisma/client';

export const getReservas = async (req: Request, res: Response) => {
  try {
    const pacienteId = req.query.pacienteId ? parseInt(req.query.pacienteId as string) : undefined;
    const odontologoId = req.query.odontologoId ? parseInt(req.query.odontologoId as string) : undefined;
    const estado = req.query.estado as EstadoReserva | undefined;

    const reservas = await reservaService.getAll(pacienteId, odontologoId, estado);
    res.json(reservas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las reservas' });
  }
};

export const getReservaById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const reserva = await reservaService.getById(id);

    if (!reserva) {
      res.status(404).json({ error: 'Reserva no encontrada' });
      return;
    }

    res.json(reserva);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la reserva' });
  }
};

// CUU 1: Reservar turno
export const createReserva = async (req: Request, res: Response) => {
  try {
    const nuevaReserva = await reservaService.createReservaTurno(req.body);
    res.status(201).json(nuevaReserva);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al procesar la reserva.' });
  }
};

export const cancelarReserva = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const motivo = req.body.motivo as string | undefined;
    const reservaCancelada = await reservaService.cancelarReserva(id, motivo);
    res.json(reservaCancelada);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al cancelar la reserva.' });
  }
};

export const finalizarReserva = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const reservaFinalizada = await reservaService.finalizarReserva(id, req.body);
    res.json(reservaFinalizada);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al finalizar la reserva/consulta.' });
  }
};
