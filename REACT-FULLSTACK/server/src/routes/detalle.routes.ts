import { Router } from 'express';
import {
  getDetalles,
  getDetalleById,
  createDetalle,
  deleteDetalle
} from '../controllers/detalle.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { CreateDetalleSchema } from '../utils/validators';

const router = Router();

// Lectura: cualquier usuario autenticado (el service no filtra por dueño, ver nota)
router.get('/', authenticateToken, getDetalles);
router.get('/:id', authenticateToken, getDetalleById);

// Registrar práctica realizada (CUU 2): odontólogo o administrador
router.post('/', authenticateToken, authorizeRoles('ODONTOLOGO', 'ADMINISTRADOR'), validateRequest(CreateDetalleSchema), createDetalle);

// Eliminar un registro clínico: sólo administrador
router.delete('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), deleteDetalle);

export default router;
