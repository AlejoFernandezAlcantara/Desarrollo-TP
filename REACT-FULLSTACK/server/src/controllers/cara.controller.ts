import { Request, Response } from 'express';
import { caraService } from '../services/cara.service';

export const getCaras = async (req: Request, res: Response) => {
  try {
    const caras = await caraService.getAll();
    res.json(caras);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las caras' });
  }
};

export const getCaraById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const cara = await caraService.getById(id);

    if (!cara) {
      res.status(404).json({ error: 'Cara no encontrada' });
      return;
    }

    res.json(cara);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la cara' });
  }
};

export const createCara = async (req: Request, res: Response) => {
  try {
    const nuevaCara = await caraService.create(req.body);
    res.status(201).json(nuevaCara);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al crear la cara. Verifica los datos enviados.' });
  }
};

export const updateCara = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const caraActualizada = await caraService.update(id, req.body);
    res.json(caraActualizada);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al actualizar la cara.' });
  }
};

export const deleteCara = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await caraService.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al eliminar la cara.' });
  }
};

export const linkCaraToDiente = async (req: Request, res: Response) => {
  try {
    const dienteId = parseInt(req.params.dienteId as string);
    const caraId = parseInt(req.params.caraId as string);
    const vinculo = await caraService.linkToDiente(dienteId, caraId);
    res.status(201).json(vinculo);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al vincular cara con diente.' });
  }
};

export const unlinkCaraFromDiente = async (req: Request, res: Response) => {
  try {
    const dienteId = parseInt(req.params.dienteId as string);
    const caraId = parseInt(req.params.caraId as string);
    await caraService.unlinkFromDiente(dienteId, caraId);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al desvincular cara de diente.' });
  }
};

export const getCarasByDiente = async (req: Request, res: Response) => {
  try {
    const dienteId = parseInt(req.params.dienteId as string);
    const caras = await caraService.getCarasByDiente(dienteId);
    res.json(caras);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las caras del diente.' });
  }
};
