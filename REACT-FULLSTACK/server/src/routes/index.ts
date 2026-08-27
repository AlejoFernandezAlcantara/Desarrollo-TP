import { Router } from 'express';
import usuarioRoutes from './usuario.routes';
// Aquí importarás las demás rutas a medida que las crees
// import pacienteRoutes from './paciente.routes';

const router = Router();

// Montar las rutas bajo su prefijo
router.use('/usuarios', usuarioRoutes);
// router.use('/pacientes', pacienteRoutes);

export default router;
