import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3001'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || 'admin',
  DB_NAME: process.env.DB_NAME || 'consultorioBdd',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // CORS
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, '')),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Validación
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTesting: process.env.NODE_ENV === 'testing',
};


// Validar que variables críticas existan
if (!env.JWT_SECRET || env.JWT_SECRET.includes('dev_secret')) {
  console.warn(
    '⚠️ WARNING: JWT_SECRET no está configurado. Usar token por defecto solo en desarrollo.'
  );
}