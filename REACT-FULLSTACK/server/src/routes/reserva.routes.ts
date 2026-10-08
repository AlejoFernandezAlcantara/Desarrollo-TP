import { Router } from 'express';
import {
  getReservas,
  getReservaById,
  createReserva,
  cancelarReserva,
  finalizarReserva
} from '../controllers/reserva.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import {
  CreateReservaSchema,
  CancelarReservaSchema,
  FinalizarReservaSchema
} from '../utils/validators';

const router = Router();

// Lectura: odontólogo y administrador. Pendiente: que el paciente vea sólo sus reservas
router.get('/', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), getReservas);
router.get('/:id', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), getReservaById);

// Reservar turno (CUU 1): paciente y administrador
router.post('/', authenticateToken, authorizeRoles('PACIENTE', 'ADMINISTRADOR'), validateRequest(CreateReservaSchema), createReserva);

// Cancelar: paciente (su reserva), odontólogo y administrador
router.put('/:id/cancelar', authenticateToken, authorizeRoles('PACIENTE', 'ODONTOLOGO', 'ADMINISTRADOR'), validateRequest(CancelarReservaSchema), cancelarReserva);

// Finalizar consulta: odontólogo y administrador
router.put('/:id/finalizar', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), validateRequest(FinalizarReservaSchema), finalizarReserva);

export default router;