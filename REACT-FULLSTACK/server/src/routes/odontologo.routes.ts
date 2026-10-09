import { Router } from 'express';
import {
  getOdontologos,
  getOdontologoById,
  createOdontologo,
  updateOdontologo,
  deleteOdontologo,
  addMutualToOdontologo,
  removeMutualFromOdontologo
} from '../controllers/odontologo.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateParams, validateQuery, validateRequest } from '../middlewares/validation.middleware';
import { CreateOdontologoSchema, UpdateOdontologoSchema, AddMutualOdontologoSchema, IdParamsSchema, MutualParamsSchema, OdontologoQuerySchema } from '../utils/validators';

const router = Router();

// Lectura: requiere sesión (el listado incluye datos personales y de matrícula)
router.get('/', authenticateToken, validateQuery(OdontologoQuerySchema), getOdontologos);
router.get('/:id', authenticateToken, validateParams(IdParamsSchema), getOdontologoById);

// Alta de odontólogos: sólo administrador
router.post('/', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(CreateOdontologoSchema), createOdontologo);
router.put('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(IdParamsSchema), validateRequest(UpdateOdontologoSchema), updateOdontologo);
router.delete('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(IdParamsSchema), deleteOdontologo);

// Vínculos con mutuales: sólo administrador
router.post('/:id/mutuales/:mutualId', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(MutualParamsSchema), validateRequest(AddMutualOdontologoSchema), addMutualToOdontologo);
router.delete('/:id/mutuales/:mutualId', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(MutualParamsSchema), removeMutualFromOdontologo);

export default router;
