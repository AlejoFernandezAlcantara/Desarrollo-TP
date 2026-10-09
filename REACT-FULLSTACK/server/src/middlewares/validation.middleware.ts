import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './error.middleware';

const armarMensaje = (error: z.ZodError): string =>
  error.issues
    .map((e) => (e.path.length ? `${e.path.join('.')}: ${e.message}` : e.message))
    .join('; ');

// Valida y reemplaza el body con los datos ya limpios (trim, tipos, campos extra descartados)
export const validateRequest =
  (schema: z.ZodType) => (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(new AppError(400, armarMensaje(result.error)));
      return;
    }

    req.body = result.data;
    next();
  };

// Valida los parámetros de la URL (/:id, /:codigo, etc.).
// Solo valida: no reemplaza req.params, así que los controllers siguen usando parseInt como hasta ahora.
export const validateParams =
  (schema: z.ZodType) => (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      next(new AppError(400, armarMensaje(result.error)));
      return;
    }

    next();
  };

// Valida los filtros de la query (?estado=...&odontologoId=...). Solo valida, no modifica req.query.
export const validateQuery =
  (schema: z.ZodType) => (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      next(new AppError(400, armarMensaje(result.error)));
      return;
    }

    next();
  };
