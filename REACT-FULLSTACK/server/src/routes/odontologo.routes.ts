import { Router } from 'express';
import {
  getOdontologos,
  getOdontologoById,
  createOdontologo,
  updateOdontologo,
  deleteOdontologo,
  addMutualToOdontologo
} from '../controllers/odontologo.controller';

const router = Router();

router.get('/', getOdontologos);
router.get('/:id', getOdontologoById);
router.post('/', createOdontologo);
router.put('/:id', updateOdontologo);
router.delete('/:id', deleteOdontologo);
router.post('/:id/mutuales', addMutualToOdontologo);

export default router;
