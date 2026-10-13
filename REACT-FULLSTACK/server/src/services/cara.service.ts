import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/error.middleware';
import { dienteService } from './diente.service';

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

  async getById(id: number) { // puede devolver null
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

  async getByIdOrThrow(id: number) { // no puede devolver null, lanza error si no encuentra
    const cara = await this.getById(id);

    if (!cara) {
      throw new AppError(404, 'Cara no encontrada');
    }

    return cara;
  },

  async create(data: { nombre: string; detalle?: string }) {
    return await prisma.cara.create({
      data
    });
  },

  async update(id: number, data: { nombre?: string; detalle?: string }) {
    await this.getByIdOrThrow(id);

    return await prisma.cara.update({
      where: { id },
      data
    });
  },

  async delete(id: number) {
    await this.getByIdOrThrow(id);

    return await prisma.cara.delete({
      where: { id }
    });
  },

  // Asociar una cara a un diente
  async linkToDiente(diente_id: number, cara_id: number) {
    await dienteService.getByIdOrThrow(diente_id);
    await this.getByIdOrThrow(cara_id);

    const existente = await prisma.dienteCara.findUnique({
      where: {
        diente_id_cara_id: {
          diente_id,
          cara_id
        }
      }
    });

    if (existente) {
      throw new AppError(409, 'La cara ya está asociada a ese diente');
    }

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
    await dienteService.getByIdOrThrow(diente_id);
    await this.getByIdOrThrow(cara_id);

    const vinculo = await prisma.dienteCara.findUnique({
      where: {
        diente_id_cara_id: {
          diente_id,
          cara_id
        }
      }
    });

    if (!vinculo) {
      throw new AppError(404, 'La cara no está asociada a ese diente');
    }

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
    await dienteService.getByIdOrThrow(diente_id);

    return await prisma.dienteCara.findMany({
      where: { diente_id },
      include: {
        cara: true
      }
    });
  }
};