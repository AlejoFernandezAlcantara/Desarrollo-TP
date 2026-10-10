import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';
import { odontologoService } from './odontologo.service';

// Estados que maneja el sistema para un turno (ver reserva.service: 'libre' y 'ocupado')
const ESTADOS_TURNO = ['libre', 'ocupado'];

const assertId = (id: number) => {
  if (isNaN(id)) {
    throw new AppError(400, 'El ID ingresado es inválido');
  }
};

const parseFecha = (valor: string | Date) => {
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) {
    throw new AppError(400, 'La fecha ingresada es inválida');
  }
  return fecha;
};

const assertEstado = (estado: string) => {
  if (!ESTADOS_TURNO.includes(estado)) {
    throw new AppError(400, `Estado de turno inválido. Valores permitidos: ${ESTADOS_TURNO.join(', ')}`);
  }
};

export const turnoService = {
  async getAll(odontologo_id?: number, estado?: string) {
    if (odontologo_id !== undefined) assertId(odontologo_id);
    if (estado !== undefined) assertEstado(estado);

    return await prisma.turno.findMany({
      where: {
        ...(odontologo_id !== undefined && { odontologo_id }),
        ...(estado && { estado })
      },
      include: {
        odontologo: {
          include: {
            usuario: true
          }
        },
        reserva: true
      },
      orderBy: {
        fecha_hora_inicio: 'asc'
      }
    });
  },

  async getDisponibles(odontologo_id?: number, fechaStr?: string) {
    if (odontologo_id !== undefined) assertId(odontologo_id);

    const now = new Date();
    let gteDate = now;
    let lteDate: Date | undefined;

    if (fechaStr) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
        throw new AppError(400, 'El formato de fecha debe ser YYYY-MM-DD');
      }

      // Si se pasa una fecha (YYYY-MM-DD), buscar turnos dentro de ese día
      const startOfDay = parseFecha(`${fechaStr}T00:00:00.000Z`);
      const endOfDay = parseFecha(`${fechaStr}T23:59:59.999Z`);
      gteDate = startOfDay > now ? startOfDay : now;
      lteDate = endOfDay;
    }

    const turnos = await prisma.turno.findMany({
      where: {
        estado: 'libre',
        fecha_hora_inicio: {
          gte: gteDate,
          ...(lteDate && { lte: lteDate })
        },
        ...(odontologo_id !== undefined && { odontologo_id })
      },
      include: {
        odontologo: {
          include: {
            usuario: true
          }
        }
      },
      orderBy: {
        fecha_hora_inicio: 'asc'
      }
    });

    // Formatear salida con datos limpios (código, fecha y hora, duración y datos del odontólogo)
    return turnos.map((t) => ({
      codigo: t.codigo,
      fecha_hora_inicio: t.fecha_hora_inicio,
      duracion: t.duracion,
      estado: t.estado,
      odontologo: {
        id: t.odontologo.id,
        nombreCompleto: `${t.odontologo.usuario.nombre} ${t.odontologo.usuario.apellido}`,
        especialidad: t.odontologo.especialidad
      }
    }));
  },

  async getById(codigo: number) { // puede devolver null
    return await prisma.turno.findUnique({
      where: { codigo },
      include: {
        odontologo: {
          include: {
            usuario: true
          }
        },
        reserva: true
      }
    });
  },

  async getByIdOrThrow(codigo: number) { // no puede devolver null, lanza error si no encuentra
    assertId(codigo);

    const turno = await this.getById(codigo);

    if (!turno) {
      throw new AppError(404, 'Turno no encontrado');
    }

    return turno;
  },

  async create(data: {
    fecha_hora_inicio: string | Date;
    duracion: number;
    odontologo_id: number;
    estado?: string;
  }) {
    assertId(data.odontologo_id);

    const fechaInicio = parseFecha(data.fecha_hora_inicio);

    if (fechaInicio.getTime() < Date.now()) {
      throw new AppError(400, 'No se puede crear un turno con fecha u hora en el pasado');
    }

    if (data.duracion === undefined || data.duracion <= 0) {
      throw new AppError(400, 'La duración debe ser mayor a 0');
    }

    const estado = data.estado ?? 'libre';
    assertEstado(estado);

    await odontologoService.getByIdOrThrow(data.odontologo_id);

    // Validar que no haya turnos superpuestos o duplicados para el mismo odontólogo el mismo día
    const fechaFin = new Date(fechaInicio.getTime() + data.duracion * 60 * 1000);
    const startOfDay = new Date(fechaInicio);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fechaInicio);
    endOfDay.setHours(23, 59, 59, 999);

    const turnosDelDia = await prisma.turno.findMany({
      where: {
        odontologo_id: data.odontologo_id,
        fecha_hora_inicio: {
          gte: new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000),
          lte: endOfDay
        }
      }
    });

    for (const t of turnosDelDia) {
      const tStart = new Date(t.fecha_hora_inicio);
      const tEnd = new Date(tStart.getTime() + t.duracion * 60 * 1000);

      if (fechaInicio < tEnd && fechaFin > tStart) {
        const horaInicioStr = tStart.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const horaFinStr = tEnd.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        throw new AppError(
          409,
          `El odontólogo ya tiene un turno en ese horario (${horaInicioStr} a ${horaFinStr} hs). No se permiten turnos superpuestos para el mismo día.`
        );
      }
    }

    return await prisma.turno.create({
      data: {
        fecha_hora_inicio: fechaInicio,
        duracion: data.duracion,
        odontologo_id: data.odontologo_id,
        estado
      },
      include: {
        odontologo: {
          include: {
            usuario: true
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
      assertId(data.odontologo_id);
      await odontologoService.getByIdOrThrow(data.odontologo_id);
    }

    if (data.duracion !== undefined && data.duracion <= 0) {
      throw new AppError(400, 'La duración debe ser mayor a 0');
    }

    if (data.estado !== undefined) {
      assertEstado(data.estado);
    }

    const fechaInicioFinal = data.fecha_hora_inicio !== undefined ? parseFecha(data.fecha_hora_inicio) : new Date(turno.fecha_hora_inicio);
    const duracionFinal = data.duracion !== undefined ? data.duracion : turno.duracion;
    const odontologoIdFinal = data.odontologo_id !== undefined ? data.odontologo_id : turno.odontologo_id;

    if (data.fecha_hora_inicio !== undefined || data.duracion !== undefined || data.odontologo_id !== undefined) {
      if (data.fecha_hora_inicio !== undefined && fechaInicioFinal.getTime() < Date.now()) {
        throw new AppError(400, 'No se puede reprogramar un turno con fecha u hora en el pasado');
      }

      const fechaFinFinal = new Date(fechaInicioFinal.getTime() + duracionFinal * 60 * 1000);
      const startOfDay = new Date(fechaInicioFinal);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(fechaInicioFinal);
      endOfDay.setHours(23, 59, 59, 999);

      const turnosDelDia = await prisma.turno.findMany({
        where: {
          odontologo_id: odontologoIdFinal,
          codigo: { not: codigo },
          fecha_hora_inicio: {
            gte: new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000),
            lte: endOfDay
          }
        }
      });

      for (const t of turnosDelDia) {
        const tStart = new Date(t.fecha_hora_inicio);
        const tEnd = new Date(tStart.getTime() + t.duracion * 60 * 1000);

        if (fechaInicioFinal < tEnd && fechaFinFinal > tStart) {
          const horaInicioStr = tStart.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
          const horaFinStr = tEnd.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
          throw new AppError(
            409,
            `El odontólogo ya tiene un turno en ese horario (${horaInicioStr} a ${horaFinStr} hs). No se permiten turnos superpuestos para el mismo día.`
          );
        }
      }
    }

    return await prisma.turno.update({
      where: { codigo },
      data: {
        ...(data.fecha_hora_inicio !== undefined && { fecha_hora_inicio: parseFecha(data.fecha_hora_inicio) }),
        ...(data.duracion !== undefined && { duracion: data.duracion }),
        ...(data.estado !== undefined && { estado: data.estado }),
        ...(data.odontologo_id !== undefined && { odontologo_id: data.odontologo_id })
      }
    });
  },

  async delete(codigo: number) {
    const turno = await this.getByIdOrThrow(codigo);

    if (turno.reserva_id !== null) {
      logger.warn('Turno con reserva asociada, no se puede eliminar', { codigo });
      throw new AppError(409, 'No se puede eliminar un turno que tiene una reserva asociada');
    }

    return await prisma.turno.delete({
      where: { codigo }
    });
  }
};
