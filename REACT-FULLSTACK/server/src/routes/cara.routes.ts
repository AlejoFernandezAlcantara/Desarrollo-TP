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
import { validateParams, validateRequest } from '../middlewares/validation.middleware';
import { CreateCaraSchema, UpdateCaraSchema, DienteCaraParamsSchema, DienteParamsSchema, IdParamsSchema } from '../utils/validators';

const router = Router();

// Públicas (lectura)
router.get('/', getCaras);
router.get('/:id', validateParams(IdParamsSchema), getCaraById);

// Protegidas: catálogo administrativo
router.post('/', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateRequest(CreateCaraSchema), createCara);
router.put('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(IdParamsSchema), validateRequest(UpdateCaraSchema), updateCara);
router.delete('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(IdParamsSchema), deleteCara);

// Relación Diente - Cara (protegidas, administrativas)
router.get('/diente/:dienteId', authenticateToken, validateParams(DienteParamsSchema), getCarasByDiente);
router.post('/diente/:dienteId/:caraId', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(DienteCaraParamsSchema), linkCaraToDiente);
router.delete('/diente/:dienteId/:caraId', authenticateToken, authorizeRoles('ADMINISTRADOR'), validateParams(DienteCaraParamsSchema), unlinkCaraFromDiente);

export default router;