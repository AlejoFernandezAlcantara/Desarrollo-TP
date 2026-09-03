import { Router } from 'express';
import {
  getDetalles,
  getDetalleById,
  createDetalle,
  deleteDetalle
} from '../controllers/detalle.controller';

const router = Router();

router.get('/', getDetalles);
router.get('/:id', getDetalleById);
router.post('/', createDetalle);
router.delete('/:id', deleteDetalle);

export default router;
