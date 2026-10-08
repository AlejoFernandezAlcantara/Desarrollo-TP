import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';

const assertId = (id: number) => {
  if (isNaN(id)) {
    throw new AppError(400, 'El ID ingresado es inválido');
  }
};

export const mutualService = {
  async getAll() {
    return await prisma.mutual.findMany();
  },

  async getById(id: number) { // puede devolver null
    return await prisma.mutual.findUnique({
      where: { id }
    });
  },

  async getByIdOrThrow(id: number) { // no puede devolver null, lanza error si no encuentra
    assertId(id);

    const mutual = await this.getById(id);

    if (!mutual) {
      throw new AppError(404, 'Mutual no encontrada');
    }

    return mutual;
  },

  async getByCuit(cuit: string) {
    return await prisma.mutual.findFirst({
      where: { cuit }
    });
  },

  async create(data: { cuit: string; nombre: string }) {
    const existente = await this.getByCuit(data.cuit);
    if (existente) {
      logger.warn('CUIT ya registrado', { cuit: data.cuit });
      throw new AppError(400, 'Ya existe una mutual registrada con ese CUIT');
    }

    return await prisma.mutual.create({
      data
    });
  },

  async update(id: number, data: { cuit?: string; nombre?: string }) {
    await this.getByIdOrThrow(id);

    if (data.cuit) {
      const existente = await this.getByCuit(data.cuit);
      if (existente && existente.id !== id) {
        throw new AppError(400, 'Ya existe una mutual registrada con ese CUIT');
      }
    }

    return await prisma.mutual.update({
      where: { id },
      data
    });
  },

  async delete(id: number) {
    await this.getByIdOrThrow(id);

    try {
      return await prisma.mutual.delete({
        where: { id }
      });
    } catch (error) {
      // P2003: violación de clave foránea, la mutual tiene relaciones activas
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new AppError(409, 'No se puede eliminar la mutual porque tiene pacientes u odontólogos asociados');
      }
      throw error;
    }
  }
};