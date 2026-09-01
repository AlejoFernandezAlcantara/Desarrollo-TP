import { prisma } from '../lib/prisma';

export const caraService = {
  async getAll() {
    return await prisma.cara.findMany({
      include: {
        dientes: {
          include: {
            diente: true
          }
        }
      }
    });
  },

  async getById(id: number) {
    return await prisma.cara.findUnique({
      where: { id },
      include: {
        dientes: {
          include: {
            diente: true
          }
        }
      }
    });
  },

  async create(data: { nombre: string; detalle?: string }) {
    return await prisma.cara.create({
      data
    });
  },

  async update(id: number, data: { nombre?: string; detalle?: string }) {
    return await prisma.cara.update({
      where: { id },
      data
    });
  },

  async delete(id: number) {
    return await prisma.cara.delete({
      where: { id }
    });
  },

  // Asociar una cara a un diente
  async linkToDiente(diente_id: number, cara_id: number) {
    return await prisma.dienteCara.create({
      data: {
        diente_id,
        cara_id
      },
      include: {
        diente: true,
        cara: true
      }
    });
  },

  // Desvincular una cara de un diente
  async unlinkFromDiente(diente_id: number, cara_id: number) {
    return await prisma.dienteCara.delete({
      where: {
        diente_id_cara_id: {
          diente_id,
          cara_id
        }
      }
    });
  },

  // Obtener todas las caras asociadas a un diente
  async getCarasByDiente(diente_id: number) {
    return await prisma.dienteCara.findMany({
      where: { diente_id },
      include: {
        cara: true
      }
    });
  }
};
