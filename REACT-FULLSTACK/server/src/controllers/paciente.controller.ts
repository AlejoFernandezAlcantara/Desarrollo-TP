import { Request, Response } from 'express';
import { pacienteService } from '../services/paciente.service';

export const getPacientes = async (req: Request, res: Response) => {
  try {
    const pacientes = await pacienteService.getAll();
    res.json(pacientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los pacientes' });
  }
};

export const getPacienteById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const paciente = await pacienteService.getById(id);

    if (!paciente) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }

    res.json(paciente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el paciente' });
  }
};

export const createPaciente = async (req: Request, res: Response) => {
  try {
    const nuevoPaciente = await pacienteService.create(req.body);
    res.status(201).json(nuevoPaciente);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al crear el paciente. Verifica los datos enviados.' });
  }
};

export const updatePaciente = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const pacienteActualizado = await pacienteService.update(id, req.body);
    res.json(pacienteActualizado);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al actualizar el paciente.' });
  }
};

export const deletePaciente = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await pacienteService.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al eliminar el paciente.' });
  }
};

export const addMutualToPaciente = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const nuevaRelacion = await pacienteService.addMutual(id, req.body);
    res.status(201).json(nuevaRelacion);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al asociar la mutual al paciente.' });
  }
};

export const removeMutualFromPaciente = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const mutualId = parseInt(req.params.mutualId as string);
    await pacienteService.removeMutual(id, mutualId);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al desvincular la mutual del paciente.' });
  }
};
