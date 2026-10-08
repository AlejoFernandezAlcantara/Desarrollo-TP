import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { CreatePacienteSchema } from '../utils/validators';
import { z } from 'zod';

const router = Router();

// Login: validamos formato mínimo, la validación de credenciales queda en el service
const LoginSchema = z.object({
  email: z.string().trim().min(1, 'Email requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

// Públicas
router.post('/login', validateRequest(LoginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/register/paciente', validateRequest(CreatePacienteSchema), authController.registerPaciente);

// Protegidas
router.get('/me', authenticateToken, authController.getMe);

export default router;