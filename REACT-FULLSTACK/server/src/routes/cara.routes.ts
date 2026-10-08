import { Router } from 'express';
import {
  getCaras,
  getCaraById,
  createCara,
  updateCara,
  deleteCara,
  linkCaraToDiente,
  unlinkCaraFromDiente,
  getCarasByDiente
} from '../controllers/cara.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { CreateCaraSchema, UpdateCaraSchema } from '../utils/validators';

const router = Router();

// Públicas (lectura)
router.get('/', getCaras);
router.get('/:id', getCaraById);

// Protegidas: catálogo administrativo
router.post('/', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(CreateCaraSchema), createCara);
router.put('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(UpdateCaraSchema), updateCara);
router.delete('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), deleteCara);

// Relación Diente - Cara (protegidas, administrativas)
router.get('/diente/:dienteId', authenticateToken, getCarasByDiente);
router.post('/diente/:dienteId/:caraId', authenticateToken, authorizeRoles('ADMINISTRADOR'), linkCaraToDiente);
router.delete('/diente/:dienteId/:caraId', authenticateToken, authorizeRoles('ADMINISTRADOR'), unlinkCaraFromDiente);

export default router;