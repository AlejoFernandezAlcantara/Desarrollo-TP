import { Router } from 'express';
import {
  getDetalles,
  getDetalleById,
  createDetalle,
  deleteDetalle
} from '../controllers/detalle.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateParams, validateQuery, validateRequest } from '../middlewares/validation.middleware';
import { CreateDetalleSchema, DetalleQuerySchema, IdParamsSchema } from '../utils/validators';

const router = Router();

// Lectura: el paciente sólo ve los detalles de sus reservas (el service filtra; un detalle ajeno responde 404)
router.get('/', authenticateToken, authorizeRoles('PACIENTE', 'ODONTOLOGO', 'ADMINISTRADOR'), validateQuery(DetalleQuerySchema), getDetalles);
router.get('/:id', authenticateToken, authorizeRoles('PACIENTE', 'ODONTOLOGO', 'ADMINISTRADOR'), validateParams(IdParamsSchema), getDetalleById);

// Registrar práctica realizada (CUU 2): odontólogo o administrador
router.post('/', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), validateRequest(CreateDetalleSchema), createDetalle);

// Eliminar un registro clínico: sólo administrador
router.delete('/:id', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), validateParams(IdParamsSchema), deleteDetalle);

export default router;