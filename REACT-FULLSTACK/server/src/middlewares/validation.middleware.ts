import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from './error.middleware';

export const validateRequest =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      const messages = error.errors
        .map((e: any) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      next(new AppError(400, messages));
    }
  };



  //ver de implementar esto de validarid (me lo paso luca lomba)
  function validarId(nombre = 'id') {
  return (req, res, next) => {
    const id = Number(req.params[nombre]);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: `El parametro ${nombre} debe ser un entero positivo`
      });
    }

    req.params[nombre] = id;
    next();
  };
}

module.exports = { validarId };