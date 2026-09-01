import { Request, Response } from 'express';
import { practicaService } from '../services/practica.service';

export const getPracticas = async (req: Request, res: Response) => {
  try {
    const practicas = await practicaService.getAll();
    res.json(practicas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener prácticas' });
  }
};

export const getPracticaById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const practica = await practicaService.getById(id);
    
    if (!practica) {
      res.status(404).json({ error: 'Práctica no encontrada' });
      return;
    }
    
    res.json(practica);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la práctica' });
  }
};

export const createPractica = async (req: Request, res: Response) => {
  try {
    const nuevaPractica = await practicaService.create(req.body);
    res.status(201).json(nuevaPractica);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al crear la práctica. Verifica los datos enviados.' });
  }
};

export const updatePractica = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const practicaActualizada = await practicaService.update(id, req.body);
    res.json(practicaActualizada);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al actualizar la práctica.' });
  }
};

export const deletePractica = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await practicaService.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al eliminar la práctica.' });
  }
};
