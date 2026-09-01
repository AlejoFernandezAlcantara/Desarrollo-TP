import { Router } from 'express';
import {
  getDientes,
  getDienteById,
  createDiente,
  updateDiente,
  deleteDiente
} from '../controllers/diente.controller';

const router = Router();

router.get('/', getDientes);
router.get('/:id', getDienteById);
router.post('/', createDiente);
router.put('/:id', updateDiente);
router.delete('/:id', deleteDiente);

export default router;
