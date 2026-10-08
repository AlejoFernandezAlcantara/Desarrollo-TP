import { Router } from 'express';
import {
  getDientes,
  getDienteById,
  createDiente,
  updateDiente,
  deleteDiente
} from '../controllers/diente.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { CreateDienteSchema, UpdateDienteSchema } from '../utils/validators';

const router = Router();

// Públicas (catálogo de dientes, lo necesita el front antes de iniciar sesión)
router.get('/', getDientes);
router.get('/:id', getDienteById);

// Protegidas: catálogo administrativo
router.post('/', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(CreateDienteSchema), createDiente);
router.put('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(UpdateDienteSchema), updateDiente);
router.delete('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), deleteDiente);

export default router;
