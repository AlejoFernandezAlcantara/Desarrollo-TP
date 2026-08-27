import express, { Application } from 'express';
import cors from 'cors';
import routes from './routes';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Para parsear el body como JSON

// Rutas principales
app.use('/api', routes);

// Ruta base de prueba
app.get('/', (req, res) => {
  res.send('¡El servidor backend (con Prisma) está funcionando correctamente!');
});

export default app;
