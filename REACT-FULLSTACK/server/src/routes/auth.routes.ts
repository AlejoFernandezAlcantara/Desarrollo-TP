import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { CreatePacienteSchema, LoginSchema } from '../utils/validators';

const router = Router();

// Públicas
router.post('/login', validateRequest(LoginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/register/paciente', validateRequest(CreatePacienteSchema), authController.registerPaciente);

// Protegidas
router.get('/me', authenticateToken, authController.getMe);

export default router;
