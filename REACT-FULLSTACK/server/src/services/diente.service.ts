import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';

const assertId = (id: number) => {
  if (isNaN(id)) {
    throw new AppError(400, 'El ID ingresado es inválido');
  }
};

export const dienteService = {
  async getAll() {
    return await prisma.diente.findMany();
  },

  async getById(id: number) { // puede devolver null
    return await prisma.diente.findUnique({
      where: { id }
    });
  },

  async getByIdOrThrow(id: number) { // no puede devolver null, lanza error si no encuentra
    assertId(id);

    const diente = await this.getById(id);

    if (!diente) {
      throw new AppError(404, 'Diente no encontrado');
    }

    return diente;
  },

  async getByNumero(numero: number) {
    return await prisma.diente.findFirst({
      where: { numero }
    });
  },

  async create(data: { numero: number; nombre?: string; tipo: string }) {
    const existente = await this.getByNumero(data.numero);
    if (existente) {
      logger.warn('Número de diente ya registrado', { numero: data.numero });
      throw new AppError(400, 'Ya existe un diente registrado con ese número');
    }

    return await prisma.diente.create({
      data
    });
  },

  async update(id: number, data: { numero?: number; nombre?: string; tipo?: string }) {
    await this.getByIdOrThrow(id);

    if (data.numero !== undefined) {
      const existente = await this.getByNumero(data.numero);
      if (existente && existente.id !== id) {
        throw new AppError(400, 'Ya existe un diente registrado con ese número');
      }
    }

    return await prisma.diente.update({
      where: { id },
      data
    });
  },

  async delete(id: number) {
    await this.getByIdOrThrow(id);

    try {
      return await prisma.diente.delete({
        where: { id }
      });
    } catch (error) {
      // P2003: violación de clave foránea, el diente está referenciado por otros registros (ej. detalles de reserva)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        logger.warn('Diente con relaciones activas, no se puede eliminar', { id });
        throw new AppError(409, 'No se puede eliminar el diente porque tiene registros asociados');
      }
      throw error;
    }
  }
};