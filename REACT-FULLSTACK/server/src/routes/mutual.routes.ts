import { Router } from 'express';
import {
  getMutuales,
  getMutualById,
  createMutual,
  updateMutual,
  deleteMutual
} from '../controllers/mutual.controller';

const router = Router();

router.get('/', getMutuales);
router.get('/:id', getMutualById);
router.post('/', createMutual);
router.put('/:id', updateMutual);
router.delete('/:id', deleteMutual);

export default router;
