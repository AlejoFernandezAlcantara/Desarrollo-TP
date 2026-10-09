import { Router } from 'express';
import * as usuarioController from '../controllers/usuario.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateParams, validateRequest } from '../middlewares/validation.middleware';
import { CreateUsuarioSchema, IdParamsSchema, UpdateUsuarioSchema } from '../utils/validators';

const router = Router();

// Gestión de cuentas de usuario: sólo administrador.
// Los datos de usuario (email, roles, activo) no deben ser accesibles a pacientes ni odontólogos.
router.use(authenticateToken, authorizeRoles('ADMINISTRADOR'));

// /api/usuarios
router.get('/', usuarioController.getAllUsuarios);
router.get('/:id', validateParams(IdParamsSchema), usuarioController.getUsuarioById);
router.post('/', validateRequest(CreateUsuarioSchema), usuarioController.createUsuario);
router.put('/:id', validateParams(IdParamsSchema), validateRequest(UpdateUsuarioSchema), usuarioController.updateUsuario);
router.delete('/:id', validateParams(IdParamsSchema), usuarioController.deleteUsuario);

export default router;