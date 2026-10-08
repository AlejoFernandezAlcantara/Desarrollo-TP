import { Router } from 'express';
import {
  getMutuales,
  getMutualById,
  createMutual,
  updateMutual,
  deleteMutual
} from '../controllers/mutual.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { CreateMutualSchema, UpdateMutualSchema } from '../utils/validators';

const router = Router();

// Públicas (catálogo de obras sociales, lo necesita el front antes de iniciar sesión)
router.get('/', getMutuales);
router.get('/:id', getMutualById);

// Protegidas: catálogo administrativo
router.post('/', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(CreateMutualSchema), createMutual);
router.put('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(UpdateMutualSchema), updateMutual);
router.delete('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), deleteMutual);

export default router;
