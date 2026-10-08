import { Router } from 'express';
import {
  getPracticas,
  getPracticaById,
  createPractica,
  updatePractica,
  deletePractica
} from '../controllers/practica.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateParams, validateRequest } from '../middlewares/validation.middleware';
import { CreatePracticaSchema, UpdatePracticaSchema, IdParamsSchema } from '../utils/validators';

const router = Router();

// Públicas (catálogo de prácticas, lo necesita el front antes de iniciar sesión)
router.get('/', getPracticas);
router.get('/:id', validateParams(IdParamsSchema), getPracticaById);

// Protegidas: catálogo administrativo
router.post('/', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(CreatePracticaSchema), createPractica);
router.put('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(IdParamsSchema), validateRequest(UpdatePracticaSchema), updatePractica);
router.delete('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(IdParamsSchema), deletePractica);

export default router;