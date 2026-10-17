import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const QUINCE_MINUTOS = 15 * 60 * 1000;

const mensaje = (texto: string) => ({
  status: 'error',
  message: texto,
});

// Límite general para toda la API.
// En desarrollo el límite es más alto para no molestar mientras se prueba el front.
export const apiLimiter = rateLimit({
  windowMs: QUINCE_MINUTOS,
  limit: env.isDevelopment ? 2000 : 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: mensaje('Demasiadas solicitudes. Intentá de nuevo en unos minutos.'),
});

// Límite estricto para login y registro: frena intentos de fuerza bruta.
// skipSuccessfulRequests: solo cuentan los intentos fallidos (4xx/5xx).
export const authLimiter = rateLimit({
  windowMs: QUINCE_MINUTOS,
  limit: env.isDevelopment ? 100 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: mensaje('Demasiados intentos de acceso. Intentá de nuevo en 15 minutos.'),
});