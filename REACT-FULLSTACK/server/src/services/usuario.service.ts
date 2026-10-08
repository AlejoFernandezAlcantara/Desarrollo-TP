import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';

type UsuarioCreateData = {
  nombre: string;
  apellido: string;
  email: string;
  password?: string;
  password_hash?: string;
};

type UsuarioUpdateData = {
  nombre?: string;
  apellido?: string;
  email?: string;
  password?: string;
  password_hash?: string;
};

const assertId = (id: number) => {
  if (isNaN(id)) {
    throw new AppError(400, 'El ID ingresado es inválido');
  }
};

const excludePassword = <T extends { password_hash?: string }>(user: T | null): Omit<T, 'password_hash'> | null => {
  if (!user) return null;
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const includeRoles = {
  paciente: true,
  odontologo: true,
  administrador: true
};

export const getAll = async () => {
  const usuarios = await prisma.usuario.findMany({
    include: includeRoles
  });

  return usuarios.map((u) => excludePassword(u));
};

export const getById = async (id: number) => { // puede devolver null
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: includeRoles
  });

  return excludePassword(usuario);
};

export const getByIdOrThrow = async (id: number) => { // no puede devolver null, lanza error si no encuentra
  assertId(id);

  const usuario = await getById(id);

  if (!usuario) {
    throw new AppError(404, 'Usuario no encontrado');
  }

  return usuario;
};

export const getByEmail = async (email: string) => {
  return await prisma.usuario.findUnique({
    where: { email }
  });
};

export const create = async (data: UsuarioCreateData) => {
  const { password, password_hash, ...campos } = data;

  if (!campos.email) {
    throw new AppError(400, 'Email requerido');
  }

  const hash = password ? await bcrypt.hash(password, 10) : password_hash;

  if (!hash) {
    throw new AppError(400, 'Debes proporcionar una contraseña (password) para el usuario');
  }

  const existente = await getByEmail(campos.email);
  if (existente) {
    logger.warn('Email ya registrado', { email: campos.email });
    throw new AppError(400, 'El email ya está registrado');
  }

  const nuevoUsuario = await prisma.usuario.create({
    data: {
      ...campos,
      password_hash: hash
    }
  });

  return excludePassword(nuevoUsuario);
};

export const update = async (id: number, data: UsuarioUpdateData) => {
  await getByIdOrThrow(id);

  const { password, password_hash, ...campos } = data;

  if (campos.email) {
    const existente = await getByEmail(campos.email);
    if (existente && existente.id !== id) {
      throw new AppError(400, 'El email ya está registrado');
    }
  }

  const hash = password ? await bcrypt.hash(password, 10) : password_hash;

  const usuarioActualizado = await prisma.usuario.update({
    where: { id },
    data: {
      ...campos,
      ...(hash && { password_hash: hash })
    }
  });

  return excludePassword(usuarioActualizado);
};

export const remove = async (id: number) => {
  await getByIdOrThrow(id);

  return await prisma.usuario.delete({
    where: { id }
  });
};
