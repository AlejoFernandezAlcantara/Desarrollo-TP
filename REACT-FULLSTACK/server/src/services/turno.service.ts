import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';
import { odontologoService } from './odontologo.service';
import { UserRole } from '../middlewares/auth.middleware';
import { usuarioPublico } from '../utils/selects';

type SolicitanteTurno = { rol: UserRole; personaId?: number };

// Los días se calculan en hora de Argentina (UTC-3, sin horario de verano desde 2009)
const TZ_AR = 'America/Argentina/Buenos_Aires';
const MS_MIN = 60 * 1000;
const MS_DIA = 24 * 60 * 60 * 1000;

// Día calendario (YYYY-MM-DD) de una fecha, visto desde Argentina
const diaAR = (fecha: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ_AR, year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);

const inicioDiaAR = (dia: string) => new Date(`${dia}T00:00:00.000-03:00`);
const finDiaAR = (dia: string) => new Date(`${dia}T23:59:59.999-03:00`);

const horaAR = (fecha: Date) =>
  fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: TZ_AR });

// Lanza 409 si el turno choca con otro del mismo odontólogo.
// excluirCodigo evita que un turno choque consigo mismo al editarse.
const verificarSolapamiento = async (odontologo_id: number, inicio: Date, duracion: number, excluirCodigo?: number) => {
  const fin = new Date(inicio.getTime() + duracion * MS_MIN);
  const dia = diaAR(inicio);

  const turnosDelDia = await prisma.turno.findMany({
    where: {
      odontologo_id,
      ...(excluirCodigo !== undefined && { codigo: { not: excluirCodigo } }),
      // Se incluye el día anterior por si un turno cruza la medianoche
      fecha_hora_inicio: {
        gte: new Date(inicioDiaAR(dia).getTime() - MS_DIA),
        lte: finDiaAR(dia),
      },
    },
  });

  for (const t of turnosDelDia) {
    const tStart = new Date(t.fecha_hora_inicio);
    const tEnd = new Date(tStart.getTime() + t.duracion * MS_MIN);

    if (inicio < tEnd && fin > tStart) {
      throw new AppError(
        409,
        `El odontólogo ya tiene un turno en ese horario (${horaAR(tStart)} a ${horaAR(tEnd)} hs). No se permiten turnos superpuestos para el mismo día.`
      );
    }
  }
};

export const turnoService = {
  async getAll(odontologo_id?: number, estado?: string, solicitante?: SolicitanteTurno) {
    // El odontólogo sólo ve su propia agenda
    const odontologoFiltro = solicitante?.rol === 'ODONTOLOGO' ? solicitante.personaId : odontologo_id;

    return await prisma.turno.findMany({
      where: {
        ...(odontologoFiltro !== undefined && { odontologo_id: odontologoFiltro }),
        ...(estado && { estado })
      },
      include: {
        odontologo: {
          include: {
            usuario: { select: usuarioPublico }
          }
        },
        reserva: true
      },
      orderBy: {
        fecha_hora_inicio: 'asc'
      }
    });
  },

  async getDisponibles(odontologo_id?: number, fecha?: string) {
    const ahora = new Date();
    let gte = ahora;
    let lte: Date | undefined;

    if (fecha) {
      // El formato y que la fecha exista ya los valida TurnoDisponiblesQuerySchema
      const inicio = inicioDiaAR(fecha);
      gte = inicio > ahora ? inicio : ahora;
      lte = finDiaAR(fecha);
    }

    const turnos = await prisma.turno.findMany({
      where: {
        estado: 'libre',
        fecha_hora_inicio: {
          gte,
          ...(lte && { lte })
        },
        ...(odontologo_id !== undefined && { odontologo_id })
      },
      include: {
        odontologo: {
          include: {
            usuario: { select: usuarioPublico },
            mutuales: {
              include: {
                mutual: true
              }
            }
          }
        }
      },
      orderBy: {
        fecha_hora_inicio: 'asc'
      }
    });

    // Salida limpia: código, fecha y hora, duración y datos del odontólogo
    return turnos.map((t) => ({
      codigo: t.codigo,
      fecha_hora_inicio: t.fecha_hora_inicio,
      duracion: t.duracion,
      estado: t.estado,
      odontologo: {
        id: t.odontologo.id,
        nombreCompleto: `${t.odontologo.usuario.nombre} ${t.odontologo.usuario.apellido}`,
        especialidad: t.odontologo.especialidad,
        mutuales: t.odontologo.mutuales.map((om) => ({
          odontologo_id: om.odontologo_id,
          mutual_id: om.mutual_id,
          mutual: {
            id: om.mutual.id,
            nombre: om.mutual.nombre,
            cuit: om.mutual.cuit
          }
        }))
      }
    }));
  },


  async getById(codigo: number) { // puede devolver null
    return await prisma.turno.findUnique({
      where: { codigo },
      include: {
        odontologo: {
          include: {
            usuario: { select: usuarioPublico }
          }
        },
        reserva: true
      }
    });
  },

  async getByIdOrThrow(codigo: number) { // no puede devolver null, lanza error si no encuentra
    const turno = await this.getById(codigo);

    if (!turno) {
      throw new AppError(404, 'Turno no encontrado');
    }

    return turno;
  },

  async create(input: {
    fecha_hora_inicio: string | Date;
    duracion: number;
    odontologo_id: number;
    estado?: string;
  }, solicitante?: SolicitanteTurno) {
    // El odontólogo sólo crea turnos para sí mismo
    const data = {
      ...input,
      odontologo_id: solicitante?.rol === 'ODONTOLOGO' ? (solicitante.personaId as number) : input.odontologo_id,
    };

    const inicio = new Date(data.fecha_hora_inicio);
    const estado = data.estado ?? 'libre';

    await odontologoService.getByIdOrThrow(data.odontologo_id);
    await verificarSolapamiento(data.odontologo_id, inicio, data.duracion);

    return await prisma.turno.create({
      data: {
        fecha_hora_inicio: inicio,
        duracion: data.duracion,
        odontologo_id: data.odontologo_id,
        estado
      },
      include: {
        odontologo: {
          include: {
            usuario: { select: usuarioPublico }
          }
        }
      }
    });
  },

  async update(codigo: number, data: {
    fecha_hora_inicio?: string | Date;
    duracion?: number;
    estado?: string;
    odontologo_id?: number;
  }) {
    const turno = await this.getByIdOrThrow(codigo);

    // Un turno asociado a una reserva no se modifica directamente
    if (turno.reserva_id !== null) {
      throw new AppError(409, 'No se puede modificar un turno que tiene una reserva asociada');
    }

    if (data.odontologo_id !== undefined) {
      await odontologoService.getByIdOrThrow(data.odontologo_id);
    }

    const inicioFinal = data.fecha_hora_inicio !== undefined ? new Date(data.fecha_hora_inicio) : new Date(turno.fecha_hora_inicio);
    const duracionFinal = data.duracion !== undefined ? data.duracion : turno.duracion;
    const odontologoIdFinal = data.odontologo_id !== undefined ? data.odontologo_id : turno.odontologo_id;

    // Sólo se revisa solapamiento si cambió algo que afecta el horario
    if (data.fecha_hora_inicio !== undefined || data.duracion !== undefined || data.odontologo_id !== undefined) {
      await verificarSolapamiento(odontologoIdFinal, inicioFinal, duracionFinal, codigo);
    }

    return await prisma.turno.update({
      where: { codigo },
      data: {
        ...(data.fecha_hora_inicio !== undefined && { fecha_hora_inicio: inicioFinal }),
        ...(data.duracion !== undefined && { duracion: data.duracion }),
        ...(data.estado !== undefined && { estado: data.estado }),
        ...(data.odontologo_id !== undefined && { odontologo_id: data.odontologo_id })
      }
    });
  },

  async delete(codigo: number, solicitante?: SolicitanteTurno) {
    const turno = await this.getByIdOrThrow(codigo);

    if (solicitante?.rol === 'ODONTOLOGO' && turno.odontologo_id !== solicitante.personaId) {
      throw new AppError(403, 'Solo podés eliminar tus propios turnos');
    }

    if (turno.reserva_id !== null) {
      logger.warn('Turno con reserva asociada, no se puede eliminar', { codigo });
      throw new AppError(409, 'No se puede eliminar un turno que tiene una reserva asociada');
    }

    return await prisma.turno.delete({
      where: { codigo }
    });
  }
};