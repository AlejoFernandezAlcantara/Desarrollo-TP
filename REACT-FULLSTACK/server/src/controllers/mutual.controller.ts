import { Request, Response } from 'express';
import { mutualService } from '../services/mutual.service';

export const getMutuales = async (req: Request, res: Response) => {
  try {
    const mutuales = await mutualService.getAll();
    res.json(mutuales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener mutuales' });
  }
};

export const getMutualById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const mutual = await mutualService.getById(id);
    
    if (!mutual) {
      res.status(404).json({ error: 'Mutual no encontrada' });
      return;
    }
    
    res.json(mutual);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la mutual' });
  }
};

export const createMutual = async (req: Request, res: Response) => {
  try {
    const nuevaMutual = await mutualService.create(req.body);
    res.status(201).json(nuevaMutual);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe una mutual registrada con ese CUIT. Debe ser único.' });
      return;
    }
    res.status(400).json({ error: error.message || 'Error al crear la mutual. Verifica los datos enviados.' });
  }
};

export const updateMutual = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const mutualActualizada = await mutualService.update(id, req.body);
    res.json(mutualActualizada);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al actualizar la mutual.' });
  }
};

export const deleteMutual = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await mutualService.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al eliminar la mutual.' });
  }
};
