import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/error.middleware';
import { UserRole } from '../middlewares/auth.middleware';
import { reservaService } from './reserva.service';
import { practicaService } from './practica.service';
import { dienteService } from './diente.service';

type SolicitanteDetalle = { rol: UserRole; personaId?: number };

export const detalleService = {
  async getAll(reserva_id?: number, odontograma_id?: number, solicitante?: SolicitanteDetalle) {
    return await prisma.detalle.findMany({
      where: {
        ...(reserva_id !== undefined && { reserva_id }),
        ...(odontograma_id !== undefined && { odontograma_id }),
        // El paciente sólo ve los detalles de sus propias reservas
        ...(solicitante?.rol === 'PACIENTE' && { reserva: { paciente_id: solicitante.personaId } })
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

  async getByIdOrThrow(id: number, solicitante?: SolicitanteDetalle) { // no puede devolver null, lanza error si no encuentra
    const detalle = await this.getById(id);

    // Para el paciente, un detalle ajeno se responde como inexistente (404) para no revelar que existe
    if (!detalle || (solicitante?.rol === 'PACIENTE' && detalle.reserva.paciente_id !== solicitante.personaId)) {
      throw new AppError(404, 'Detalle no encontrado');
    }

    return detalle;
  },

  // CUU 2: Registrar prácticas realizadas en una consulta
  async create(data: {
    reserva_id: number;
    practica_id?: number;
    practica_personalizada?: string;
    diente_id?: number;
    observaciones?: string;
  }) {
    // Validar que la reserva exista
    const reserva = await reservaService.getByIdOrThrow(data.reserva_id);

    let finalPracticaId = data.practica_id;

    // Si viene práctica personalizada, buscarla o crearla en el catálogo
    if (!finalPracticaId && data.practica_personalizada) {
      const detalleTexto = data.practica_personalizada.trim();
      const practicaExistente = await prisma.practica.findFirst({
        where: { detalle: detalleTexto }
      });

      if (practicaExistente) {
        finalPracticaId = practicaExistente.id;
      } else {
        // Generar código único para la práctica personalizada (ej: PERS-123456)
        const codigoGen = `PERS-${Date.now().toString().slice(-6)}`;
        const nuevaPractica = await prisma.practica.create({
          data: {
            codigo: codigoGen,
            detalle: detalleTexto,
            precio: 0
          }
        });
        finalPracticaId = nuevaPractica.id;
      }
    }

    // Validar que la práctica exista
    await practicaService.getByIdOrThrow(finalPracticaId);

    // Validar diente si se especificó
    if (data.diente_id !== undefined) {
      await dienteService.getByIdOrThrow(data.diente_id);
    }

    // El odontograma siempre es el del paciente de la reserva; si no tiene, se crea
    const odontograma = reserva.paciente.odontograma
      ?? await prisma.odontograma.create({
        data: {
          paciente_id: reserva.paciente_id,
          estado: 'Activo'
        }
      });

    return await prisma.detalle.create({
      data: {
        reserva_id: data.reserva_id,
        practica_id: finalPracticaId,
        odontograma_id: odontograma.id,
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

    return await prisma.detalle.delete({
      where: { id }
    });
  }
};