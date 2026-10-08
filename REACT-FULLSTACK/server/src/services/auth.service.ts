import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';
import { UserRole, AuthPayload } from '../middlewares/auth.middleware';
import { pacienteService } from './paciente.service';
import { env } from '../config/env';

export interface UserResponse {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: UserRole;
  personaId?: number;
}

export interface RegisterPacienteData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  direccion: string;
  telefono?: string;
  nroDocumento: string;
  tipoDoc: 'DNI' | 'Pasaporte';
}

const includeRoles = {
  administrador: true,
  odontologo: true,
  paciente: true
};

type UsuarioBase = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
};

type UsuarioConRoles = UsuarioBase & {
  administrador: object | null;
  odontologo: { id: number } | null;
  paciente: { id: number } | null;
};

const normalizarEmail = (email: string) => email.toLowerCase().trim();

const resolverRol = (usuario: UsuarioConRoles): { rol: UserRole; personaId?: number } => {
  if (usuario.administrador) return { rol: 'ADMINISTRADOR' };
  if (usuario.odontologo) return { rol: 'ODONTOLOGO', personaId: usuario.odontologo.id };
  if (usuario.paciente) return { rol: 'PACIENTE', personaId: usuario.paciente.id };

  throw new AppError(403, 'El usuario no posee un rol asignado en el sistema');
};

const toUserResponse = (usuario: UsuarioBase, rol: UserRole, personaId?: number): UserResponse => ({
  id: usuario.id,
  nombre: usuario.nombre,
  apellido: usuario.apellido,
  email: usuario.email,
  rol,
  personaId
});

const generarToken = (id: number, email: string, rol: UserRole, personaId?: number) => {
  const payload: AuthPayload = { id, email, rol, personaId };

  const options: jwt.SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const authService = {
  async login(email: string, password: string) {
    if (!email || !password) {
      throw new AppError(400, 'Debes proporcionar email y contraseña');
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: normalizarEmail(email) },
      include: includeRoles
    });

    if (!usuario) {
      logger.warn('Intento de login con email no registrado', { email });
      throw new AppError(401, 'Credenciales inválidas');
    }

    if (!usuario.activo) {
      throw new AppError(401, 'La cuenta de usuario se encuentra desactivada');
    }

    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) {
      logger.warn('Intento de login con contraseña incorrecta', { usuarioId: usuario.id });
      throw new AppError(401, 'Credenciales inválidas');
    }

    const { rol, personaId } = resolverRol(usuario);

    return {
      token: generarToken(usuario.id, usuario.email, rol, personaId),
      usuario: toUserResponse(usuario, rol, personaId)
    };
  },

  async getMe(userId: number): Promise<UserResponse> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: includeRoles
    });

    if (!usuario) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    const { rol, personaId } = resolverRol(usuario);
    return toUserResponse(usuario, rol, personaId);
  },

  async registerPaciente(data: RegisterPacienteData) {
    if (!data.nombre || !data.apellido || !data.email || !data.password || !data.direccion || !data.nroDocumento || !data.tipoDoc) {
      throw new AppError(400, 'Todos los campos obligatorios deben ser completados');
    }

    if (data.password.length < 6) {
      throw new AppError(400, 'La contraseña debe tener al menos 6 caracteres');
    }

    if (data.tipoDoc !== 'DNI' && data.tipoDoc !== 'Pasaporte') {
      throw new AppError(400, 'El tipo de documento debe ser DNI o Pasaporte');
    }

    // pacienteService.create valida el email duplicado, hashea la contraseña y crea el odontograma
    const paciente = await pacienteService.create({
      ...data,
      email: normalizarEmail(data.email)
    });

    if (!paciente) {
      throw new AppError(500, 'No se pudo registrar el paciente');
    }

    const rol: UserRole = 'PACIENTE';
    const personaId = paciente.id;

    return {
      token: generarToken(paciente.usuario.id, paciente.usuario.email, rol, personaId),
      usuario: toUserResponse(paciente.usuario, rol, personaId)
    };
  }
};