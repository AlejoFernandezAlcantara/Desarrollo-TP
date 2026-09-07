import { Router } from 'express';
import authRoutes from './auth.routes';
import usuarioRoutes from './usuario.routes';
import practicaRoutes from './practica.routes';
import mutualRoutes from './mutual.routes';
import odontologoRoutes from './odontologo.routes';
import dienteRoutes from './diente.routes';
import pacienteRoutes from './paciente.routes';
import caraRoutes from './cara.routes';
import turnoRoutes from './turno.routes';
import reservaRoutes from './reserva.routes';
import detalleRoutes from './detalle.routes';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'API funcionando correctamente',
    endpoints: [
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/me',
      '/api/usuarios',
      '/api/practicas',
      '/api/mutuales',
      '/api/odontologos',
      '/api/dientes',
      '/api/pacientes',
      '/api/caras',
      '/api/turnos',
      '/api/reservas',
      '/api/detalles'
    ]
  });
});

// Montar las rutas bajo su prefijo
router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/practicas', practicaRoutes);
router.use('/mutuales', mutualRoutes);
router.use('/odontologos', odontologoRoutes);
router.use('/dientes', dienteRoutes);
router.use('/pacientes', pacienteRoutes);
router.use('/caras', caraRoutes);
router.use('/turnos', turnoRoutes);
router.use('/reservas', reservaRoutes);
router.use('/detalles', detalleRoutes);

export default router;
