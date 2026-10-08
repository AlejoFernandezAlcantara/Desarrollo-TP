import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middlewares/error.middleware';
import { pacienteService } from '../services/paciente.service';
import { logger } from '../utils/logger';
import { mutualService } from '../services/mutual.service';


/*POST /api/pacientes*/
export const createPaciente = asyncHandler(async (req: Request, res: Response) => {
  const { email, nroDocumento } = req.body;

  logger.info('Intentando crear paciente', { email });
    if (!email || !nroDocumento) {
      throw new AppError(400, 'Email y nroDocumento son requeridos');
  }
   
  const paciente = await pacienteService.create(req.body);
  logger.info('Paciente creado exitosamente', { pacienteId: paciente.id, email });

  res.status(201).json({
    success: true,
    message: 'Paciente registrado exitosamente',
    data: paciente,
  });
});

/*GET /api/pacientes*/
export const getPacientes = asyncHandler(async (req: Request, res: Response) => {
  logger.info('Obteniendo lista de pacientes');

  const pacientes = await pacienteService.getAll();
  logger.debug('Pacientes obtenidos', { cantidad: pacientes.length });

  res.json({
    success: true,
    data: pacientes,
    total: pacientes.length,
  });
});

/* GET /api/pacientes/:id*/
export const getPacienteById = asyncHandler(async (req: Request, res: Response) => {
  const id  = req.params.id as string;
  const pacienteId = parseInt(id);

  logger.info('Buscando paciente', { pacienteId });

  if (isNaN(pacienteId)) {
    throw new AppError(400, 'El ID ingresado es inválido');
  }

  const paciente = await pacienteService.getByIdOrThrow(pacienteId);
  logger.debug('Paciente encontrado', { pacienteId });

  res.json({
    success: true,
    data: paciente,
  });
});

/* PUT /api/pacientes/:id*/
export const updatePaciente = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const pacienteId = parseInt(id);

  logger.info('Actualizando paciente', { pacienteId, cambios: Object.keys(req.body) });

  if (isNaN(pacienteId)) {
    throw new AppError(400, 'ID inválido');
  }
  const pacienteActualizado = await pacienteService.update(pacienteId, req.body);
  logger.info('Paciente actualizado exitosamente', { pacienteId });

  res.json({
    success: true,
    message: 'Paciente actualizado exitosamente',
    data: pacienteActualizado,
  });
});

/*DELETE /api/pacientes/:id*/
export const deletePaciente = asyncHandler(async (req: Request, res: Response) => {
  const id  = req.params.id as string;
  const pacienteId = parseInt(id);

  logger.info('Eliminando paciente', { pacienteId });

  if (isNaN(pacienteId)) {
    throw new AppError(400, 'El ID ingresado es inválido');
  }

  await pacienteService.delete(pacienteId);
  logger.info('Paciente eliminado exitosamente', { pacienteId });

  res.status(204).json();
});

/*POST /api/pacientes/:id/mutuales/:mutualId*/
export const addMutualToPaciente = asyncHandler(async (req: Request, res: Response) => {
  const { id, mutualId, } = req.params as { id: string; mutualId: string};
  const { nroAfiliado, cubre } = req.body;
  const pacienteId = parseInt(id);
  const mutId = parseInt(mutualId);

  logger.info('Asociando mutual a paciente', { pacienteId, mutualId: mutId });

  if (isNaN(pacienteId) || isNaN(mutId)) {
    throw new AppError(400, 'Los IDs ingresados son inválidos');
  }
  await mutualService.getByIdOrThrow(mutId);
  await pacienteService.getByIdOrThrow(pacienteId);
  
  const resultado = await pacienteService.addMutual(pacienteId,{ mutual_id:mutId, nroAfiliado: nroAfiliado, cubre });
  logger.info('Mutual asociado exitosamente', { pacienteId, mutualId: mutId });

  res.json({
    success: true,
    message: 'Mutual asociado al paciente',
    data: resultado,
  });
});

/*DELETE /api/pacientes/:id/mutuales/:mutualId*/
export const removeMutualFromPaciente = asyncHandler(async (req: Request, res: Response) => {
  const { id, mutualId } = req.params as { id: string; mutualId: string };
  const pacienteId = parseInt(id);
  const mutId = parseInt(mutualId);

  logger.info('Desasociando mutual de paciente', { pacienteId, mutualId: mutId });

  if (isNaN(pacienteId) || isNaN(mutId)) {
    throw new AppError(400, 'Los IDs ingresados son inválidos');
  }

  await pacienteService.removeMutual(pacienteId, mutId);
  logger.info('Mutual desasociado exitosamente del paciente ', { pacienteId, mutualId: mutId });

  res.status(204).json();
});