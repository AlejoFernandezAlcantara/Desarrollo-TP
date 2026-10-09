import { Router } from 'express';
import {
  getMutuales,
  getMutualById,
  createMutual,
  updateMutual,
  deleteMutual
} from '../controllers/mutual.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateParams, validateRequest } from '../middlewares/validation.middleware';
import { CreateMutualSchema, UpdateMutualSchema, IdParamsSchema } from '../utils/validators';

const router = Router();

// Públicas (catálogo de obras sociales, lo necesita el front antes de iniciar sesión)
router.get('/', getMutuales);
router.get('/:id', validateParams(IdParamsSchema), getMutualById);

// Protegidas: catálogo administrativo
router.post('/', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(CreateMutualSchema), createMutual);
router.put('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(IdParamsSchema), validateRequest(UpdateMutualSchema), updateMutual);
router.delete('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(IdParamsSchema), deleteMutual);

export default router;
