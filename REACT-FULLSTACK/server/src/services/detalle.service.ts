import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';
import { reservaService } from './reserva.service';
import { practicaService } from './practica.service';
import { dienteService } from './diente.service';

const assertId = (id: number) => {
  if (isNaN(id)) {
    throw new AppError(400, 'El ID ingresado es inválido');
  }
};

export const detalleService = {
  async getAll(reserva_id?: number, odontograma_id?: number) {
    if (reserva_id !== undefined) assertId(reserva_id);
    if (odontograma_id !== undefined) assertId(odontograma_id);

    return await prisma.detalle.findMany({
      where: {
        ...(reserva_id !== undefined && { reserva_id }),
        ...(odontograma_id !== undefined && { odontograma_id })
      },
      include: {
        practica: true,
        diente: true,
        odontograma: true,
        reserva: true
      },
      orderBy: {
        fecha_realizacion: 'desc'
      }
    });
  },

  async getById(id: number) { // puede devolver null
    return await prisma.detalle.findUnique({
      where: { id },
      include: {
        practica: true,
        diente: true,
        odontograma: true,
        reserva: true
      }
    });
  },

  async getByIdOrThrow(id: number) { // no puede devolver null, lanza error si no encuentra
    assertId(id);

    const detalle = await this.getById(id);

    if (!detalle) {
      throw new AppError(404, 'Detalle no encontrado');
    }

    return detalle;
  },

  // CUU 2: Registrar prácticas realizadas en una consulta
  async create(data: {
    reserva_id: number;
    practica_id: number;
    diente_id?: number;
    observaciones?: string;
    odontograma_id?: number;
  }) {
    assertId(data.reserva_id);
    assertId(data.practica_id);

    // Validar que la reserva exista
    const reserva = await reservaService.getByIdOrThrow(data.reserva_id);

    // Validar que la práctica exista
    await practicaService.getByIdOrThrow(data.practica_id);

    // Validar diente si se especificó
    if (data.diente_id !== undefined) {
      await dienteService.getByIdOrThrow(data.diente_id);
    }

    let targetOdontogramaId = data.odontograma_id;

    // Si no enviaron el odontograma_id, lo tomamos del paciente de la reserva
    if (targetOdontogramaId === undefined) {
      const odontograma = reserva.paciente.odontograma;

      if (odontograma) {
        targetOdontogramaId = odontograma.id;
      } else {
        // Si por alguna razón el paciente no tenía odontograma, se crea al vuelo
        const nuevoOdontograma = await prisma.odontograma.create({
          data: {
            paciente_id: reserva.paciente_id,
            estado: 'Activo'
          }
        });
        targetOdontogramaId = nuevoOdontograma.id;
      }
    }

    return await prisma.detalle.create({
      data: {
        reserva_id: data.reserva_id,
        practica_id: data.practica_id,
        odontograma_id: targetOdontogramaId,
        diente_id: data.diente_id,
        observaciones: data.observaciones
      },
      include: {
        practica: true,
        diente: true,
        odontograma: true
      }
    });
  },

  async delete(id: number) {
    await this.getByIdOrThrow(id);

    try {
      return await prisma.detalle.delete({
        where: { id }
      });
    } catch (error) {
      // P2003: violación de clave foránea
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        logger.warn('Detalle con relaciones activas, no se puede eliminar', { id });
        throw new AppError(409, 'No se puede eliminar el detalle porque tiene registros asociados');
      }
      throw error;
    }
  }
};