import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/register/paciente', authController.registerPaciente);
router.get('/me', authenticateToken, authController.getMe);

export default router;
