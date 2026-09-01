import { Router } from 'express';
import {
  getTurnos,
  getTurnosDisponibles,
  getTurnoById,
  createTurno,
  updateTurno,
  deleteTurno
} from '../controllers/turno.controller';

const router = Router();

// Rutas específicas primero
router.get('/disponibles', getTurnosDisponibles);

// Rutas generales y por código
router.get('/', getTurnos);
router.get('/:codigo', getTurnoById);
router.post('/', createTurno);
router.put('/:codigo', updateTurno);
router.delete('/:codigo', deleteTurno);

export default router;
