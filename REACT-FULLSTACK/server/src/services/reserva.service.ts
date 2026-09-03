import { prisma } from '../lib/prisma';
import { EstadoReserva, ResultadoReserva } from '@prisma/client';

export const reservaService = {
  async getAll(paciente_id?: number, odontologo_id?: number, estado?: EstadoReserva) {
    return await prisma.reserva.findMany({
      where: {
        ...(paciente_id && { paciente_id }),
        ...(odontologo_id && { odontologo_id }),
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

  async getById(id_reserva: number) {
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

  // CUU 1: Reservar un turno con un Odontólogo (Transaccional)
  async createReservaTurno(data: {
    paciente_id: number;
    turno_codigo: number;
    mutual_id?: number;
    observaciones?: string;
    coseguro?: number;
  }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Validar que el turno exista y esté libre
      const turno = await tx.turno.findUnique({
        where: { codigo: data.turno_codigo }
      });

      if (!turno) {
        throw new Error('El turno especificado no existe.');
      }

      if (turno.estado !== 'libre') {
        throw new Error('El turno seleccionado ya no está disponible.');
      }

      // 2. Validar que el paciente exista
      const paciente = await tx.paciente.findUnique({
        where: { id: data.paciente_id }
      });

      if (!paciente) {
        throw new Error('El paciente especificado no existe.');
      }

      // 3. Crear la reserva
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

      // 4. Actualizar el estado del turno y asociarlo a la reserva
      await tx.turno.update({
        where: { codigo: data.turno_codigo },
        data: {
          estado: 'ocupado',
          reserva_id: reserva.id_reserva
        }
      });

      // 5. Retornar la reserva completa
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
    return await prisma.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({
        where: { id_reserva },
        include: { turnos: true }
      });

      if (!reserva) {
        throw new Error('Reserva no encontrada.');
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
          observaciones: motivo ? `${reserva.observaciones ? reserva.observaciones + ' - ' : ''}Motivo cancelación: ${motivo}` : reserva.observaciones
        }
      });
    });
  },

  // Finalizar consulta / reserva realizada
  async finalizarReserva(id_reserva: number, data: {
    resultado: ResultadoReserva;
    observaciones?: string;
  }) {
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
