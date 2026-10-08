import { prisma } from '../lib/prisma';
import { EstadoReserva, ResultadoReserva } from '@prisma/client';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';
import { pacienteService } from './paciente.service';
import { mutualService } from './mutual.service';

const assertId = (id: number) => {
  if (isNaN(id)) {
    throw new AppError(400, 'El ID ingresado es inválido');
  }
};

export const reservaService = {
  async getAll(paciente_id?: number, odontologo_id?: number, estado?: EstadoReserva) {
    if (paciente_id !== undefined) assertId(paciente_id);
    if (odontologo_id !== undefined) assertId(odontologo_id);

    return await prisma.reserva.findMany({
      where: {
        ...(paciente_id !== undefined && { paciente_id }),
        ...(odontologo_id !== undefined && { odontologo_id }),
        ...(estado && { estado })
      },
      include: {
        paciente: {
          include: {
            usuario: true
          }
        },
        odontologo: {
          include: {
            usuario: true
          }
        },
        mutual: true,
        turnos: true,
        detalles: {
          include: {
            practica: true,
            diente: true
          }
        }
      },
      orderBy: {
        fecha_creacion: 'desc'
      }
    });
  },

  async getById(id_reserva: number) { // puede devolver null
    return await prisma.reserva.findUnique({
      where: { id_reserva },
      include: {
        paciente: {
          include: {
            usuario: true,
            odontograma: true
          }
        },
        odontologo: {
          include: {
            usuario: true
          }
        },
        mutual: true,
        turnos: true,
        detalles: {
          include: {
            practica: true,
            diente: true
          }
        }
      }
    });
  },

  async getByIdOrThrow(id_reserva: number) { // no puede devolver null, lanza error si no encuentra
    assertId(id_reserva);

    const reserva = await this.getById(id_reserva);

    if (!reserva) {
      throw new AppError(404, 'Reserva no encontrada');
    }

    return reserva;
  },

  // CUU 1: Reservar un turno con un Odontólogo (transaccional)
  async createReservaTurno(data: {
    paciente_id: number;
    turno_codigo: number;
    mutual_id?: number;
    observaciones?: string;
    coseguro?: number;
  }) {
    assertId(data.paciente_id);
    assertId(data.turno_codigo);

    await pacienteService.getByIdOrThrow(data.paciente_id);

    if (data.mutual_id !== undefined) {
      await mutualService.getByIdOrThrow(data.mutual_id);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Validar que el turno exista y esté libre
      const turno = await tx.turno.findUnique({
        where: { codigo: data.turno_codigo }
      });

      if (!turno) {
        throw new AppError(404, 'El turno especificado no existe');
      }

      if (turno.estado !== 'libre') {
        throw new AppError(409, 'El turno seleccionado ya no está disponible');
      }

      // 2. Crear la reserva
      const reserva = await tx.reserva.create({
        data: {
          paciente_id: data.paciente_id,
          odontologo_id: turno.odontologo_id,
          mutual_id: data.mutual_id,
          estado: 'confirmada',
          observaciones: data.observaciones,
          coseguro: data.coseguro
        }
      });

      // 3. Marcar el turno como ocupado y asociarlo a la reserva
      await tx.turno.update({
        where: { codigo: data.turno_codigo },
        data: {
          estado: 'ocupado',
          reserva_id: reserva.id_reserva
        }
      });

      // 4. Devolver la reserva completa
      return await tx.reserva.findUnique({
        where: { id_reserva: reserva.id_reserva },
        include: {
          paciente: {
            include: {
              usuario: true
            }
          },
          odontologo: {
            include: {
              usuario: true
            }
          },
          mutual: true,
          turnos: true
        }
      });
    });
  },

  // Cancelar reserva (libera los turnos asociados)
  async cancelarReserva(id_reserva: number, motivo?: string) {
    assertId(id_reserva);

    return await prisma.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({
        where: { id_reserva }
      });

      if (!reserva) {
        throw new AppError(404, 'Reserva no encontrada');
      }

      if (reserva.estado !== 'confirmada') {
        throw new AppError(409, `No se puede cancelar una reserva en estado "${reserva.estado}"`);
      }

      // Liberar los turnos asociados
      await tx.turno.updateMany({
        where: { reserva_id: id_reserva },
        data: {
          estado: 'libre',
          reserva_id: null
        }
      });

      // Actualizar estado de la reserva
      return await tx.reserva.update({
        where: { id_reserva },
        data: {
          estado: 'cancelada',
          observaciones: motivo
            ? `${reserva.observaciones ? reserva.observaciones + ' - ' : ''}Motivo cancelación: ${motivo}`
            : reserva.observaciones
        }
      });
    });
  },

  // Finalizar consulta / reserva realizada
  async finalizarReserva(id_reserva: number, data: {
    resultado: ResultadoReserva;
    observaciones?: string;
  }) {
    const reserva = await this.getByIdOrThrow(id_reserva);

    if (reserva.estado !== 'confirmada') {
      throw new AppError(409, `No se puede finalizar una reserva en estado "${reserva.estado}"`);
    }

    return await prisma.reserva.update({
      where: { id_reserva },
      data: {
        estado: 'realizada',
        fechaRealizacion: new Date(),
        resultado: data.resultado,
        ...(data.observaciones && { observaciones: data.observaciones })
      },
      include: {
        detalles: {
          include: {
            practica: true,
            diente: true
          }
        }
      }
    });
  }
};