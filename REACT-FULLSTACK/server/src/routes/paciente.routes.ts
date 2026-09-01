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

const router = Router();

router.get('/', getPacientes);
router.get('/:id', getPacienteById);
router.post('/', createPaciente);
router.put('/:id', updatePaciente);
router.delete('/:id', deletePaciente);

// Rutas para gestionar mutuales del paciente
router.post('/:id/mutuales', addMutualToPaciente);
router.delete('/:id/mutuales/:mutualId', removeMutualFromPaciente);

export default router;
