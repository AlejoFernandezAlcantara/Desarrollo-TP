import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middlewares/error.middleware';
import { pacienteService } from '../services/paciente.service';
import { logger } from '../utils/logger';


/*POST /api/pacientes*/
export const createPaciente = asyncHandler(async (req: Request, res: Response) => {
  const { email, nroDocumento } = req.body;

  logger.info('Intentando crear paciente', { email });
  if (!email || !nroDocumento) {
  throw new AppError(400, 'Email y nroDocumento son requeridos');
  }
  // Verificar que no exista otro con el mismo email (compara con email)
  const pacienteExistente = await pacienteService.getByEmail(email);
  if (pacienteExistente) {
    logger.warn('Email ya registrado', { email });
    throw new AppError(400, 'El email ya está registrado');
  }

  // Verificar que no exista otro con el mismo DNI
  /*const dniExistente = await pacienteService.findByDNI(nroDocumento);
  if (dniExistente) {
    logger.warn('DNI ya registrado', { nroDocumento });
    throw new AppError(400, 'El DNI ya está registrado');
  }*/ /*Para implementar (si se quiere) cambiar en schema.prisma para hacer el campo nroDocumento como unique)*/

  
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

  const paciente = await pacienteService.getById(pacienteId);

  if (!paciente) {
    logger.warn('Paciente no encontrado', { pacienteId });
    throw new AppError(404, 'Paciente no encontrado');
  }

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

  // Verificar que el paciente existe
  const pacienteExistente = await pacienteService.getById(pacienteId);
  if (!pacienteExistente) {
    logger.warn('Paciente no encontrado para actualizar', { pacienteId });
    throw new AppError(404, 'Paciente no encontrado');
  }

  // Verificar que no esté en uso el email ingresado si es diferente al actual (ver si se permite cambiar)
  if (req.body.email && req.body.email !== pacienteExistente.usuario?.email) {
    const emailEnUso = await pacienteService.getByEmail(req.body.email);
    if (emailEnUso) {
      logger.warn('Email ya en uso', { email: req.body.email });
      throw new AppError(400, 'El email ya está en uso');
    }
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

  
  const paciente = await pacienteService.getById(pacienteId);
  if (!paciente) {
    logger.warn('Paciente no encontrado para eliminar', { pacienteId });
    throw new AppError(404, 'Paciente no encontrado. No se puede eliminar');
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
  const mutualExistente = await pacienteService.getById(mutId);
  if (!mutualExistente) {
    throw new AppError(404, 'Mutual no encontrada');
  }

  const paciente = await pacienteService.getById(pacienteId);
  if (!paciente) {
    throw new AppError(404, 'Paciente no encontrado');
  }

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