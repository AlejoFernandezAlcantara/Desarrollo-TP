import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/error.middleware';

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

    return await prisma.practica.delete({
      where: { id }
    });
  }
};