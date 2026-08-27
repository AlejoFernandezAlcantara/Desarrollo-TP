import { Router } from 'express';
import * as usuarioController from '../controllers/usuario.controller';

const router = Router();

// /api/usuarios
router.get('/', usuarioController.getAllUsuarios);
router.get('/:id', usuarioController.getUsuarioById);
router.post('/', usuarioController.createUsuario);
router.put('/:id', usuarioController.updateUsuario);
router.delete('/:id', usuarioController.deleteUsuario);

export default router;
