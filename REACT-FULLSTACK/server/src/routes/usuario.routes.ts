import { Router } from 'express';
import * as usuarioController from '../controllers/usuario.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

// Gestión de cuentas de usuario: sólo administrador.
// Los datos de usuario (email, roles, activo) no deben ser accesibles a pacientes ni odontólogos.
router.use(authenticateToken, authorizeRoles('ADMINISTRADOR'));

// /api/usuarios
router.get('/', usuarioController.getAllUsuarios);
router.get('/:id', usuarioController.getUsuarioById);
router.post('/', usuarioController.createUsuario);
router.put('/:id', usuarioController.updateUsuario);
router.delete('/:id', usuarioController.deleteUsuario);

export default router;