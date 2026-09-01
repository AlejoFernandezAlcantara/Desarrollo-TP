import { prisma } from '../lib/prisma';

export const practicaService = {
  async getAll() {
    return await prisma.practica.findMany();
  },

  async getById(id: number) {
    return await prisma.practica.findUnique({
      where: { id }
    });
  },

  async create(data: { codigo: string; detalle: string; precio: number }) {
    return await prisma.practica.create({
      data
    });
  },

  async update(id: number, data: { codigo?: string; detalle?: string; precio?: number }) {
    return await prisma.practica.update({
      where: { id },
      data
    });
  },

  async delete(id: number) {
    return await prisma.practica.delete({
      where: { id }
    });
  }
};
