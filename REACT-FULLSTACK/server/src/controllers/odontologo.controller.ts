import { Request, Response } from 'express';
import { odontologoService } from '../services/odontologo.service';

export const getOdontologos = async (req: Request, res: Response) => {
  try {
    const mutualId = req.query.mutualId ? parseInt(req.query.mutualId as string) : undefined;
    const odontologos = await odontologoService.getAll(mutualId);
    res.json(odontologos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener odontólogos' });
  }
};

export const addMutualToOdontologo = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const vinculo = await odontologoService.addMutual(id, req.body);
    res.status(201).json(vinculo);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al vincular la mutual al odontólogo.' });
  }
};

export const getOdontologoById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const odontologo = await odontologoService.getById(id);
    
    if (!odontologo) {
      res.status(404).json({ error: 'Odontólogo no encontrado' });
      return;
    }
    
    res.json(odontologo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el odontólogo' });
  }
};

export const createOdontologo = async (req: Request, res: Response) => {
  try {
    const nuevoOdontologo = await odontologoService.create(req.body);
    res.status(201).json(nuevoOdontologo);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al crear el odontólogo. Verifica los datos enviados.' });
  }
};

export const updateOdontologo = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const odontologoActualizado = await odontologoService.update(id, req.body);
    res.json(odontologoActualizado);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al actualizar el odontólogo.' });
  }
};

export const deleteOdontologo = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await odontologoService.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al eliminar el odontólogo.' });
  }
};
