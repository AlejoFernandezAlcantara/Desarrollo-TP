import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

export const getAll = async () => {
  return await prisma.usuario.findMany({
    include: {
      paciente: true,
      odontologo: true,
      administrador: true
    }
  });
};

export const getById = async (id: number) => {
  return await prisma.usuario.findUnique({
    where: { id },
    include: {
      paciente: true,
      odontologo: true,
      administrador: true
    }
  });
};

export const create = async (data: Prisma.UsuarioCreateInput) => {
  return await prisma.usuario.create({
    data
  });
};

export const update = async (id: number, data: Prisma.UsuarioUpdateInput) => {
  return await prisma.usuario.update({
    where: { id },
    data
  });
};

export const remove = async (id: number) => {
  return await prisma.usuario.delete({
    where: { id }
  });
};
