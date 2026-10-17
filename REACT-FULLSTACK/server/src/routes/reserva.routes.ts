import { Router } from 'express';
import {
  getReservas,
  getReservaById,
  createReserva,
  cancelarReserva,
  finalizarReserva
} from '../controllers/reserva.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateParams, validateQuery, validateRequest } from '../middlewares/validation.middleware';
import { CreateReservaSchema, CancelarReservaSchema, FinalizarReservaSchema, IdParamsSchema, ReservaQuerySchema } from '../utils/validators';

const router = Router();

// Listado: el administrador ve todo; el odontólogo solo las reservas de su agenda y el paciente solo las suyas (el service fuerza el filtro)
router.get('/', authenticateToken, authorizeRoles('PACIENTE', 'ODONTOLOGO', 'ADMINISTRADOR'), validateQuery(ReservaQuerySchema), getReservas);
// Detalle: odontólogo y administrador
router.get('/:id', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), validateParams(IdParamsSchema), getReservaById);

// Reservar turno (CUU 1): paciente y administrador
router.post('/', authenticateToken, authorizeRoles('PACIENTE', 'ADMINISTRADOR'), validateRequest(CreateReservaSchema), createReserva);

// Cancelar: paciente (su reserva), odontólogo y administrador
router.put('/:id/cancelar', authenticateToken, authorizeRoles('PACIENTE', 'ODONTOLOGO', 'ADMINISTRADOR'), validateParams(IdParamsSchema), validateRequest(CancelarReservaSchema), cancelarReserva);

// Finalizar consulta: odontólogo y administrador
router.put('/:id/finalizar', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), validateParams(IdParamsSchema), validateRequest(FinalizarReservaSchema), finalizarReserva);

export default router;