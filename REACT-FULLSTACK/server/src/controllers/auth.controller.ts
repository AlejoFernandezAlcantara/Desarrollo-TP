import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

const isProduction = process.env.NODE_ENV === 'production';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Debes proporcionar email y contraseña' });
      return;
    }

    const { token, usuario } = await authService.login(email, password);

    // Enviar JWT en cookie HttpOnly segura
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario
    });
  } catch (error: any) {
    if (error.message === 'Credenciales inválidas' || error.message.includes('desactivada')) {
      res.status(401).json({ error: error.message });
      return;
    }
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax'
    });

    res.json({ mensaje: 'Sesión cerrada exitosamente' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const usuario = await authService.getMe(req.user.id);
    res.json({ usuario });
  } catch (error: any) {
    console.error('Error en getMe:', error);
    res.status(500).json({ error: 'Error al obtener datos del usuario autenticado' });
  }
};

export const registerPaciente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, apellido, email, password, direccion, telefono, nroDocumento, tipoDoc } = req.body;

    if (!nombre || !apellido || !email || !password || !direccion || !nroDocumento || !tipoDoc) {
      res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    if (tipoDoc !== 'DNI' && tipoDoc !== 'Pasaporte') {
      res.status(400).json({ error: 'El tipo de documento debe ser DNI o Pasaporte' });
      return;
    }

    const { token, usuario } = await authService.registerPaciente({
      nombre,
      apellido,
      email,
      password,
      direccion,
      telefono,
      nroDocumento,
      tipoDoc
    });

    // Enviar JWT en cookie HttpOnly segura para inicio de sesión inmediato
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    res.status(201).json({
      mensaje: 'Paciente registrado exitosamente',
      usuario
    });
  } catch (error: any) {
    if (error.message.includes('ya se encuentra registrado')) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Error en registerPaciente:', error);
    res.status(500).json({ error: 'Error interno del servidor al registrar paciente' });
  }
};
