import { Router } from 'express';
import {
  getPacientes,
  getPacienteById,
  createPaciente,
  updatePaciente,
  deletePaciente,
  addMutualToPaciente,
  removeMutualFromPaciente
} from '../controllers/paciente.controller';
import { authenticateToken, authorizeRoles, soloPropioSiPaciente } from '../middlewares/auth.middleware';
import { validateParams, validateRequest } from '../middlewares/validation.middleware';
import { CreatePacienteSchema, UpdatePacienteSchema, AddMutualPacienteSchema, IdParamsSchema, MutualParamsSchema } from '../utils/validators';

const router = Router();

// Lectura: datos clínicos y personales, requiere sesión.
// Padrón completo: odontólogo y administrador. Ficha individual: además el propio paciente (sólo la suya).
router.get('/', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), getPacientes);
router.get('/:id', authenticateToken, authorizeRoles('PACIENTE', 'ODONTOLOGO', 'ADMINISTRADOR'), validateParams(IdParamsSchema), soloPropioSiPaciente, getPacienteById);

// Alta, edición y baja: sólo administrador
router.post('/', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(CreatePacienteSchema), createPaciente);
router.put('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(IdParamsSchema), validateRequest(UpdatePacienteSchema), updatePaciente);
router.delete('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(IdParamsSchema), deletePaciente);

// Vínculos con mutuales: sólo administrador
// Corregido: el controller lee el mutualId de la URL, por eso la ruta incluye /:mutualId
router.post('/:id/mutuales/:mutualId', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(MutualParamsSchema), validateRequest(AddMutualPacienteSchema), addMutualToPaciente);
router.delete('/:id/mutuales/:mutualId', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(MutualParamsSchema), removeMutualFromPaciente);

export default router;
