import { Router } from 'express';
import {
  getReservas,
  getReservaById,
  createReserva,
  cancelarReserva,
  finalizarReserva
} from '../controllers/reserva.controller';

const router = Router();

router.get('/', getReservas);
router.get('/:id', getReservaById);
router.post('/', createReserva);
router.put('/:id/cancelar', cancelarReserva);
router.put('/:id/finalizar', finalizarReserva);

export default router;
