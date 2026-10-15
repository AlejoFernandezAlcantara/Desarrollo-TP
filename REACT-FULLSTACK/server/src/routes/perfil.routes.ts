import { Router, Request, Response, NextFunction } from 'express';
import { getPerfil, updatePerfil, cambiarPassword } from '../controllers/perfil.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import {
  UpdatePerfilPacienteSchema,
  UpdatePerfilOdontologoSchema,
  CambiarPasswordSchema
} from '../utils/validators';

const router = Router();

// Cada usuario trabaja siempre sobre SU propio registro (se toma del token, no de la URL).
// El administrador no tiene datos personales extra y sigue gestionando cuentas desde /api/usuarios.
router.use(authenticateToken, authorizeRoles('PACIENTE', 'ODONTOLOGO'));

// El paciente y el odontólogo tienen campos distintos: se elige el schema según el rol del token
const validarPerfilPorRol = (req: Request, res: Response, next: NextFunction): void => {
  const schema = req.user?.rol === 'ODONTOLOGO' ? UpdatePerfilOdontologoSchema : UpdatePerfilPacienteSchema;
  validateRequest(schema)(req, res, next);
};

// /api/perfil
router.get('/', getPerfil);
router.put('/', validarPerfilPorRol, updatePerfil);
router.put('/password', validateRequest(CambiarPasswordSchema), cambiarPassword);

export default router;