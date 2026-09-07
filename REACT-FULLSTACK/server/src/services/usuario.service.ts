import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const excludePassword = <T extends { password_hash?: string }>(user: T | null): Omit<T, 'password_hash'> | null => {
  if (!user) return null;
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const getAll = async () => {
  const usuarios = await prisma.usuario.findMany({
    include: {
      paciente: true,
      odontologo: true,
      administrador: true
    }
  });

  return usuarios.map(u => excludePassword(u));
};

export const getById = async (id: number) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: {
      paciente: true,
      odontologo: true,
      administrador: true
    }
  });

  return excludePassword(usuario);
};

export const create = async (data: Prisma.UsuarioCreateInput & { password?: string }) => {
  let hash = data.password_hash;
  if (data.password) {
    hash = await bcrypt.hash(data.password, 10);
  } else if (hash && !hash.startsWith('$2')) {
    // Si viene texto plano en password_hash, lo hasheamos
    hash = await bcrypt.hash(hash, 10);
  }

  const nuevoUsuario = await prisma.usuario.create({
    data: {
      ...data,
      password_hash: hash
    }
  });

  return excludePassword(nuevoUsuario);
};

export const update = async (id: number, data: Prisma.UsuarioUpdateInput & { password?: string }) => {
  const dataToUpdate: any = { ...data };

  if (data.password) {
    dataToUpdate.password_hash = await bcrypt.hash(data.password as string, 10);
    delete dataToUpdate.password;
  } else if (typeof data.password_hash === 'string' && !data.password_hash.startsWith('$2')) {
    dataToUpdate.password_hash = await bcrypt.hash(data.password_hash, 10);
  }

  const usuarioActualizado = await prisma.usuario.update({
    where: { id },
    data: dataToUpdate
  });

  return excludePassword(usuarioActualizado);
};

export const remove = async (id: number) => {
  return await prisma.usuario.delete({
    where: { id }
  });
};
