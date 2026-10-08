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
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { CreatePacienteSchema, UpdatePacienteSchema, AddMutualPacienteSchema } from '../utils/validators';

const router = Router();

// Lectura: datos clínicos y personales, requiere sesión. Odontólogo y administrador
router.get('/', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), getPacientes);
router.get('/:id', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), getPacienteById);

// Alta, edición y baja: sólo administrador
router.post('/', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(CreatePacienteSchema), createPaciente);
router.put('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(UpdatePacienteSchema), updatePaciente);
router.delete('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), deletePaciente);

// Vínculos con mutuales: sólo administrador
// Corregido: el controller lee el mutualId de la URL, por eso la ruta incluye /:mutualId
router.post('/:id/mutuales/:mutualId', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(AddMutualPacienteSchema), addMutualToPaciente);
router.delete('/:id/mutuales/:mutualId', authenticateToken, authorizeRoles('ADMINISTRADOR'), removeMutualFromPaciente);

export default router;
