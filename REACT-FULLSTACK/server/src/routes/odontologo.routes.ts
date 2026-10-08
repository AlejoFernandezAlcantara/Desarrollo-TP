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
import { validateRequest } from '../middlewares/validation.middleware';
import { CreateOdontologoSchema, UpdateOdontologoSchema, AddMutualOdontologoSchema } from '../utils/validators';

const router = Router();

// Lectura: requiere sesión (el listado incluye datos personales y de matrícula)
router.get('/', authenticateToken, getOdontologos);
router.get('/:id', authenticateToken, getOdontologoById);

// Alta de odontólogos: sólo administrador
router.post('/', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(CreateOdontologoSchema), createOdontologo);
router.put('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(UpdateOdontologoSchema), updateOdontologo);
router.delete('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), deleteOdontologo);

// Vínculos con mutuales: sólo administrador
router.post('/:id/mutuales/:mutualId', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(AddMutualOdontologoSchema), addMutualToOdontologo);
router.delete('/:id/mutuales/:mutualId', authenticateToken, authorizeRoles('ADMINISTRADOR'), removeMutualFromOdontologo);

export default router;
