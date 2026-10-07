import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { env } from './config/env';

const app: Application = express();

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// Middlewares
app.use(cors({
  origin: clientUrl,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json()); // Para parsear el body como JSON

// Rutas principales
app.use('/api', routes);

// Ruta base de prueba
app.get('/', (req, res) => {
  res.send('¡El servidor backend (con Prisma) está funcionando correctamente!');
});
app.use(errorHandler);
app.use(
  cors({
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
  })
);
export default app;



