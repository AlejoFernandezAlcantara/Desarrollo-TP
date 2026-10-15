import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { perfilService } from '../services/perfil.service';

// authenticateToken garantiza req.user en todas estas rutas

/* GET /api/perfil */
export const getPerfil = asyncHandler(async (req: Request, res: Response) => {
  const perfil = await perfilService.getPerfil(req.user!);

  res.json({
    success: true,
    data: perfil,
  });
});

/* PUT /api/perfil */
export const updatePerfil = asyncHandler(async (req: Request, res: Response) => {
  const { id, rol } = req.user!;

  // req.body ya fue validado y limpiado por el schema que corresponde al rol (ver perfil.routes.ts)
  const perfil =
    rol === 'ODONTOLOGO'
      ? await perfilService.updateOdontologo(id, req.body)
      : await perfilService.updatePaciente(id, req.body);

  res.json({
    success: true,
    message: 'Datos personales actualizados',
    data: perfil,
  });
});

/* PUT /api/perfil/password */
export const cambiarPassword = asyncHandler(async (req: Request, res: Response) => {
  const { passwordActual, passwordNueva } = req.body;

  await perfilService.cambiarPassword(req.user!.id, passwordActual, passwordNueva);

  res.json({
    success: true,
    message: 'Contraseña actualizada correctamente',
  });
});