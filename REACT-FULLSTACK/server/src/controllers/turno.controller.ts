import { Request, Response } from 'express';
import { turnoService } from '../services/turno.service';

export const getTurnos = async (req: Request, res: Response) => {
  try {
    const odontologoId = req.query.odontologoId ? parseInt(req.query.odontologoId as string) : undefined;
    const estado = req.query.estado as string | undefined;
    const turnos = await turnoService.getAll(odontologoId, estado);
    res.json(turnos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los turnos' });
  }
};

export const getTurnosDisponibles = async (req: Request, res: Response) => {
  try {
    const odontologoId = req.query.odontologoId ? parseInt(req.query.odontologoId as string) : undefined;
    const fecha = req.query.fecha as string | undefined; // Formato YYYY-MM-DD
    const turnos = await turnoService.getDisponibles(odontologoId, fecha);
    res.json(turnos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener turnos disponibles' });
  }
};

export const getTurnoById = async (req: Request, res: Response) => {
  try {
    const codigo = parseInt(req.params.codigo as string);
    const turno = await turnoService.getById(codigo);

    if (!turno) {
      res.status(404).json({ error: 'Turno no encontrado' });
      return;
    }

    res.json(turno);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el turno' });
  }
};

export const createTurno = async (req: Request, res: Response) => {
  try {
    const nuevoTurno = await turnoService.create(req.body);
    res.status(201).json(nuevoTurno);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al crear el turno. Verifica los datos enviados.' });
  }
};

export const updateTurno = async (req: Request, res: Response) => {
  try {
    const codigo = parseInt(req.params.codigo as string);
    const turnoActualizado = await turnoService.update(codigo, req.body);
    res.json(turnoActualizado);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al actualizar el turno.' });
  }
};

export const deleteTurno = async (req: Request, res: Response) => {
  try {
    const codigo = parseInt(req.params.codigo as string);
    await turnoService.delete(codigo);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al eliminar el turno.' });
  }
};
