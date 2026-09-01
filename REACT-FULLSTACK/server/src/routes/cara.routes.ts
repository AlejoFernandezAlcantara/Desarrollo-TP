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

const router = Router();

router.get('/', getCaras);
router.get('/:id', getCaraById);
router.post('/', createCara);
router.put('/:id', updateCara);
router.delete('/:id', deleteCara);

// Rutas de relación Diente - Cara
router.get('/diente/:dienteId', getCarasByDiente);
router.post('/diente/:dienteId/:caraId', linkCaraToDiente);
router.delete('/diente/:dienteId/:caraId', unlinkCaraFromDiente);

export default router;
