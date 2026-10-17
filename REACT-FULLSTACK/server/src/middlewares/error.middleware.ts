import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Red de seguridad para errores de Prisma que no se hayan capturado en los services
const mapearErrorPrisma = (err: Prisma.PrismaClientKnownRequestError): { status: number; message: string } | null => {
  switch (err.code) {
    case 'P2002':
      return { status: 409, message: 'Ya existe un registro con esos datos' };
    case 'P2003':
      return { status: 409, message: 'El registro está asociado a otros datos' };
    case 'P2025':
      return { status: 404, message: 'Registro no encontrado' };
    default:
      return null;
  }
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Si ya se envió una respuesta, delegar en el handler por defecto de Express
  if (res.headersSent) {
    next(err);
    return;
  }

  const timestamp = new Date().toISOString();

  // Error de JSON mal formado en el body
  if ((err as { type?: string }).type === 'entity.parse.failed') {
    logger.warn('Body JSON inválido', { path: req.path });
    res.status(400).json({ success: false, error: 'El cuerpo de la petición no es un JSON válido', timestamp });
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Error operacional del servidor', { message: err.message, path: req.path, stack: err.stack });
    } else {
      logger.warn('Error de cliente', { status: err.statusCode, message: err.message, path: req.path });
    }

    res.status(err.statusCode).json({ success: false, error: err.message, timestamp });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapeado = mapearErrorPrisma(err);

    if (mapeado) {
      logger.warn('Error de Prisma mapeado', { code: err.code, path: req.path });
      res.status(mapeado.status).json({ success: false, error: mapeado.message, timestamp });
      return;
    }
  }

  // Error desconocido: se loguea completo y se responde genérico
  const stack = err instanceof Error ? err.stack : undefined;
  logger.error('Error no controlado', { message: err instanceof Error ? err.message : String(err), path: req.path, stack });

  res.status(500).json({ success: false, error: 'Error interno del servidor', timestamp });
};

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncController): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };