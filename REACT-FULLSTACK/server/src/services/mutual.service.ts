import { prisma } from '../lib/prisma';

export const mutualService = {
  async getAll() {
    return await prisma.mutual.findMany();
  },

  async getById(id: number) {
    return await prisma.mutual.findUnique({
      where: { id }
    });
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
