import { prisma } from '../lib/prisma';

export const turnoService = {
  async getAll(odontologo_id?: number, estado?: string) {
    return await prisma.turno.findMany({
      where: {
        ...(odontologo_id && { odontologo_id }),
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
    const now = new Date();
    let gteDate = now;
    let lteDate: Date | undefined;

    if (fechaStr) {
      // Si se pasa una fecha (YYYY-MM-DD), buscar turnos dentro de ese día
      const startOfDay = new Date(`${fechaStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${fechaStr}T23:59:59.999Z`);
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
        ...(odontologo_id && { odontologo_id })
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

  async getById(codigo: number) {
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

  async create(data: {
    fecha_hora_inicio: string | Date;
    duracion: number;
    odontologo_id: number;
    estado?: string;
  }) {
    return await prisma.turno.create({
      data: {
        fecha_hora_inicio: new Date(data.fecha_hora_inicio),
        duracion: data.duracion,
        odontologo_id: data.odontologo_id,
        estado: data.estado || 'libre'
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
    return await prisma.turno.update({
      where: { codigo },
      data: {
        ...(data.fecha_hora_inicio && { fecha_hora_inicio: new Date(data.fecha_hora_inicio) }),
        ...(data.duracion && { duracion: data.duracion }),
        ...(data.estado && { estado: data.estado }),
        ...(data.odontologo_id && { odontologo_id: data.odontologo_id })
      }
    });
  },

  async delete(codigo: number) {
    return await prisma.turno.delete({
      where: { codigo }
    });
  }
};
