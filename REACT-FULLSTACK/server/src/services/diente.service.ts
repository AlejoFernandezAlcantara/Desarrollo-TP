import { prisma } from '../lib/prisma';

export const dienteService = {
  async getAll() {
    return await prisma.diente.findMany();
  },

  async getById(id: number) {
    return await prisma.diente.findUnique({
      where: { id }
    });
  },

  async create(data: { numero: number; nombre?: string; tipo: string }) {
    return await prisma.diente.create({
      data
    });
  },

  async update(id: number, data: { numero?: number; nombre?: string; tipo?: string }) {
    return await prisma.diente.update({
      where: { id },
      data
    });
  },

  async delete(id: number) {
    return await prisma.diente.delete({
      where: { id }
    });
  }
};
