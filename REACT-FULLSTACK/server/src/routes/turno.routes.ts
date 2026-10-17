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
import { validateParams, validateQuery, validateRequest } from '../middlewares/validation.middleware';
import { CreateTurnoSchema, UpdateTurnoSchema, CodigoParamsSchema, TurnoDisponiblesQuerySchema, TurnoQuerySchema } from '../utils/validators';

const router = Router();

// Públicas: el paciente necesita ver turnos libres antes de reservar.
// /disponibles tiene que ir antes de /:codigo para que no lo tome como código.
router.get('/disponibles', validateQuery(TurnoDisponiblesQuerySchema), getTurnosDisponibles);

// Lectura de la agenda completa: odontólogo y administrador
router.get('/', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), validateQuery(TurnoQuerySchema), getTurnos);
router.get('/:codigo', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), validateParams(CodigoParamsSchema), getTurnoById);

// Gestión de la agenda: administrador y odontólogo (solo puede crear/borrar los suyos)
router.post('/', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), validateRequest(CreateTurnoSchema), createTurno);
router.put('/:codigo', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(CodigoParamsSchema), validateRequest(UpdateTurnoSchema), updateTurno);
router.delete('/:codigo', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), validateParams(CodigoParamsSchema), deleteTurno);

export default router;
