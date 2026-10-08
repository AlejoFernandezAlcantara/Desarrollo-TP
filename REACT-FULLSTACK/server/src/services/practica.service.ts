import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';

const assertId = (id: number) => {
  if (isNaN(id)) {
    throw new AppError(400, 'El ID ingresado es inválido');
  }
};

export const practicaService = {
  async getAll() {
    return await prisma.practica.findMany();
  },

  async getById(id: number) { // puede devolver null
    return await prisma.practica.findUnique({
      where: { id }
    });
  },

  async getByIdOrThrow(id: number) { // no puede devolver null, lanza error si no encuentra
    assertId(id);

    const practica = await this.getById(id);

    if (!practica) {
      throw new AppError(404, 'Práctica no encontrada');
    }

    return practica;
  },

  async create(data: { codigo: string; detalle: string; precio: number }) {
    return await prisma.practica.create({
      data
    });
  },

  async update(id: number, data: { codigo?: string; detalle?: string; precio?: number }) {
    await this.getByIdOrThrow(id);

    return await prisma.practica.update({
      where: { id },
      data
    });
  },

  async delete(id: number) {
    await this.getByIdOrThrow(id);

    try {
      return await prisma.practica.delete({
        where: { id }
      });
    } catch (error) {
      // P2003: violación de clave foránea, la práctica está referenciada por otros registros
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        logger.warn('Práctica con relaciones activas, no se puede eliminar', { id });
        throw new AppError(409, 'No se puede eliminar la práctica porque tiene registros asociados');
      }
      throw error;
    }
  }
};
