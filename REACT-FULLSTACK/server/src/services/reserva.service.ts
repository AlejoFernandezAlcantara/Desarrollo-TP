import { prisma } from '../lib/prisma';
import { EstadoReserva, ResultadoReserva } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';
import { pacienteService } from './paciente.service';
import { mutualService } from './mutual.service';
import { usuarioPublico } from '../utils/selects';
import { UserRole } from '../middlewares/auth.middleware';

type SolicitanteReserva = { rol: UserRole; personaId?: number };

export const reservaService = {
  async getAll(paciente_id?: number, odontologo_id?: number, estado?: EstadoReserva, solicitante?: SolicitanteReserva) {
    // El paciente sólo ve sus propias reservas, sin importar el filtro que mande
    const pacienteFiltro = solicitante?.rol === 'PACIENTE' ? solicitante.personaId : paciente_id;
    // El odontólogo sólo ve las reservas de su propia agenda, sin importar el filtro que mande
    const odontologoFiltro = solicitante?.rol === 'ODONTOLOGO' ? solicitante.personaId : odontologo_id;

    return await prisma.reserva.findMany({
      where: {
        ...(pacienteFiltro !== undefined && { paciente_id: pacienteFiltro }),
        ...(odontologoFiltro !== undefined && { odontologo_id: odontologoFiltro }),
        ...(estado && { estado })
      },
      include: {
        paciente: {
          include: {
            usuario: { select: usuarioPublico }
          }
        },
        odontologo: {
          include: {
            usuario: { select: usuarioPublico }
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
            usuario: { select: usuarioPublico },
            odontograma: true
          }
        },
        odontologo: {
          include: {
            usuario: { select: usuarioPublico }
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
  }, solicitante?: SolicitanteReserva) {
    if (solicitante?.rol === 'PACIENTE' && data.paciente_id !== solicitante.personaId) {
      throw new AppError(403, 'Solo podés reservar para vos mismo');
    }

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

      // Validar mutual con odontólogo y paciente si se imputa una mutual
      if (data.mutual_id !== undefined) {
        const atiende = await tx.odontologoMutual.findUnique({
          where: {
            odontologo_id_mutual_id: {
              odontologo_id: turno.odontologo_id,
              mutual_id: data.mutual_id
            }
          }
        });
        if (!atiende) {
          throw new AppError(400, 'El odontólogo seleccionado no trabaja con esa obra social');
        }

        const afiliado = await tx.pacienteMutual.findUnique({
          where: {
            paciente_id_mutual_id: {
              paciente_id: data.paciente_id,
              mutual_id: data.mutual_id
            }
          }
        });
        if (!afiliado) {
          throw new AppError(400, 'El paciente no está afiliado a esa obra social');
        }
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
              usuario: { select: usuarioPublico }
            }
          },
          odontologo: {
            include: {
              usuario: { select: usuarioPublico }
            }
          },
          mutual: true,
          turnos: true
        }
      });
    });
  },

  // Cancelar reserva (libera los turnos asociados)
  async cancelarReserva(id_reserva: number, motivo?: string, solicitante?: SolicitanteReserva) {
    return await prisma.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({
        where: { id_reserva }
      });

      if (!reserva) {
        throw new AppError(404, 'Reserva no encontrada');
      }

      if (solicitante?.rol === 'PACIENTE' && reserva.paciente_id !== solicitante.personaId) {
        throw new AppError(403, 'Solo podés cancelar tus propias reservas');
      }

      if (solicitante?.rol === 'ODONTOLOGO' && reserva.odontologo_id !== solicitante.personaId) {
        throw new AppError(403, 'Solo podés cancelar tus propias reservas');
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
  }, solicitante?: SolicitanteReserva) {
    const reserva = await this.getByIdOrThrow(id_reserva);

    if (solicitante?.rol === 'ODONTOLOGO' && reserva.odontologo_id !== solicitante.personaId) {
      throw new AppError(403, 'Solo podés finalizar tus propias reservas');
    }

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