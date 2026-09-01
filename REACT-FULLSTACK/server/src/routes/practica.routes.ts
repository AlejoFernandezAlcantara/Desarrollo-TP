import { Router } from 'express';
import {
  getPracticas,
  getPracticaById,
  createPractica,
  updatePractica,
  deletePractica
} from '../controllers/practica.controller';

const router = Router();

router.get('/', getPracticas);
router.get('/:id', getPracticaById);
router.post('/', createPractica);
router.put('/:id', updatePractica);
router.delete('/:id', deletePractica);

export default router;
