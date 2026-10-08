import { Request, Response, NextFunction } from 'express';
import { z, ZodError} from 'zod';
import { AppError } from './error.middleware';

export const validateRequest =
  (schema: z.ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
      } catch (error) {
        if (error instanceof ZodError) {
        const messages = error.issues
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('; ');
        return next(new AppError(400, messages));
      }
      next(error);
  }
};














  //(me lo paso luca lomba)
 /* function validarId(nombre = 'id') {
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

module.exports = { validarId };*/