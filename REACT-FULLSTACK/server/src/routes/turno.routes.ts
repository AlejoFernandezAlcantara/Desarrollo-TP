import { Router } from 'express';
import {
  getTurnos,
  getTurnosDisponibles,
  getTurnoById,
  createTurno,
  updateTurno,
  deleteTurno
} from '../controllers/turno.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { CreateTurnoSchema, UpdateTurnoSchema } from '../utils/validators';

const router = Router();

// Públicas: el paciente necesita ver turnos libres antes de reservar.
// /disponibles tiene que ir antes de /:codigo para que no lo tome como código.
router.get('/disponibles', getTurnosDisponibles);

// Lectura de la agenda completa: odontólogo y administrador
router.get('/', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), getTurnos);
router.get('/:codigo', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), getTurnoById);

// Gestión de la agenda: sólo administrador
router.post('/', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(CreateTurnoSchema), createTurno);
router.put('/:codigo', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(UpdateTurnoSchema), updateTurno);
router.delete('/:codigo', authenticateToken, authorizeRoles('ADMINISTRADOR'), deleteTurno);

export default router;
