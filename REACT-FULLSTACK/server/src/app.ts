import './config/env';
import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { AppError } from './middlewares/error.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { env } from './config/env';
import helmet from 'helmet';
import { apiLimiter, authLimiter } from './middlewares/rateLimit.middleware';

const app: Application = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: env.ALLOWED_ORIGINS,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Rate limit: general para toda la API y estricto para login/registro
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Rutas principales
app.use('/api', routes);

// Ruta base de prueba
app.get('/', (req, res) => {
  res.send('¡El servidor backend (con Prisma) está funcionando correctamente!');
});
app.use((req, res, next) => {
  next(new AppError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

export default app;



