import { Request, Response } from 'express';
import { dienteService } from '../services/diente.service';

export const getDientes = async (req: Request, res: Response) => {
  try {
    const dientes = await dienteService.getAll();
    res.json(dientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener dientes' });
  }
};

export const getDienteById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const diente = await dienteService.getById(id);
    
    if (!diente) {
      res.status(404).json({ error: 'Diente no encontrado' });
      return;
    }
    
    res.json(diente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el diente' });
  }
};

export const createDiente = async (req: Request, res: Response) => {
  try {
    const nuevoDiente = await dienteService.create(req.body);
    res.status(201).json(nuevoDiente);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al crear el diente. Verifica los datos enviados.' });
  }
};

export const updateDiente = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const dienteActualizado = await dienteService.update(id, req.body);
    res.json(dienteActualizado);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al actualizar el diente.' });
  }
};

export const deleteDiente = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await dienteService.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al eliminar el diente.' });
  }
};
