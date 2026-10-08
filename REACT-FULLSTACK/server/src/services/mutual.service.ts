import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/error.middleware';

export const mutualService = {
  async getAll() {
    return await prisma.mutual.findMany();
  },

  async getById(id: number) {
    return await prisma.mutual.findUnique({
      where: { id }
    });
  },
  async getByIdOrThrow(id: number) { //no puede devolver null, lanza error si no encuentra
      const mutual = await this.getById(id);
   
      if (!mutual) {
        throw new AppError(404, 'Mutual no encontrado');
      }
  
      return mutual;
    },

  async create(data: { cuit: string; nombre: string }) {
    return await prisma.mutual.create({
      data
    });
  },

  async update(id: number, data: { cuit?: string; nombre?: string }) {
    return await prisma.mutual.update({
      where: { id },
      data
    });
  },

  async delete(id: number) {
    return await prisma.mutual.delete({
      where: { id }
    });
  }
};
