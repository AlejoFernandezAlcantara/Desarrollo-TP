import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';

export const dienteService = {
  async getAll() {
    // Incluye las caras de cada pieza (tabla diente_cara) para dibujar el odontograma
    return await prisma.diente.findMany({
      orderBy: { numero: 'asc' },
      include: { caras: { select: { cara: { select: { id: true, nombre: true } } } } },
    });
  },

  async getById(id: number) { // puede devolver null
    return await prisma.diente.findUnique({
      where: { id }
    });
  },

  async getByIdOrThrow(id: number) { // no puede devolver null, lanza error si no encuentra
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

    return await prisma.diente.delete({
      where: { id }
    });
  }
};