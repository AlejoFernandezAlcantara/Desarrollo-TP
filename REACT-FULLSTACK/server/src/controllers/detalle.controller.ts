import { Request, Response } from 'express';
import { detalleService } from '../services/detalle.service';

export const getDetalles = async (req: Request, res: Response) => {
  try {
    const reservaId = req.query.reservaId ? parseInt(req.query.reservaId as string) : undefined;
    const odontogramaId = req.query.odontogramaId ? parseInt(req.query.odontogramaId as string) : undefined;
    const detalles = await detalleService.getAll(reservaId, odontogramaId);
    res.json(detalles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los detalles de prácticas' });
  }
};

export const getDetalleById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const detalle = await detalleService.getById(id);

    if (!detalle) {
      res.status(404).json({ error: 'Detalle no encontrado' });
      return;
    }

    res.json(detalle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el detalle' });
  }
};

// CUU 2: Registrar práctica realizada en una consulta
export const createDetalle = async (req: Request, res: Response) => {
  try {
    const nuevoDetalle = await detalleService.create(req.body);
    res.status(201).json(nuevoDetalle);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al registrar la práctica realizada.' });
  }
};

export const deleteDetalle = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await detalleService.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al eliminar el detalle de práctica.' });
  }
};
