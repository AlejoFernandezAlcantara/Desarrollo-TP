import dotenv from 'dotenv';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevelopment = NODE_ENV === 'development';

// Fuera de desarrollo el secreto es obligatorio y debe ser largo.
// En desarrollo se permite un valor por defecto para no bloquear el arranque local.
const JWT_SECRET_DEV = 'dev_secret_change_in_production';
const jwtSecretEnv = process.env.JWT_SECRET;

if (!isDevelopment && (!jwtSecretEnv || jwtSecretEnv.length < 32)) {
  throw new Error(
    'JWT_SECRET es obligatorio fuera de desarrollo y debe tener al menos 32 caracteres. La aplicación no puede arrancar.'
  );
}

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3001'),
  NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || 'admin',
  DB_NAME: process.env.DB_NAME || 'consultorioBdd',

  // JWT
  JWT_SECRET: jwtSecretEnv || (isDevelopment ? JWT_SECRET_DEV : ''),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // CORS
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, '')),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Entorno
  isDevelopment,
  isProduction: NODE_ENV === 'production',
  isTesting: NODE_ENV === 'testing',
};