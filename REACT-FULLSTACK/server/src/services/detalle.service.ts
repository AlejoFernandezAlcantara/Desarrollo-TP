import { prisma } from '../lib/prisma';

export const detalleService = {
  async getAll(reserva_id?: number, odontograma_id?: number) {
    return await prisma.detalle.findMany({
      where: {
        ...(reserva_id && { reserva_id }),
        ...(odontograma_id && { odontograma_id })
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

  async getById(id: number) {
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

  // CUU 2: Registrar prácticas realizadas en una consulta
  async create(data: {
    reserva_id: number;
    practica_id: number;
    diente_id?: number;
    observaciones?: string;
    odontograma_id?: number;
  }) {
    let targetOdontogramaId = data.odontograma_id;

    // Si no enviaron el odontograma_id directamente, lo buscamos a través del paciente de la reserva
    if (!targetOdontogramaId) {
      const reserva = await prisma.reserva.findUnique({
        where: { id_reserva: data.reserva_id },
        include: {
          paciente: {
            include: {
              odontograma: true
            }
          }
        }
      });

      if (!reserva) {
        throw new Error('La reserva especificada no existe.');
      }

      if (!reserva.paciente.odontograma) {
        // Si por alguna razón el paciente no tenía odontograma creado, se lo creamos al vuelo
        const nuevoOdontograma = await prisma.odontograma.create({
          data: {
            paciente_id: reserva.paciente_id,
            estado: 'Activo'
          }
        });
        targetOdontogramaId = nuevoOdontograma.id;
      } else {
        targetOdontogramaId = reserva.paciente.odontograma.id;
      }
    }

    // Validar que la práctica exista
    const practica = await prisma.practica.findUnique({
      where: { id: data.practica_id }
    });

    if (!practica) {
      throw new Error('La práctica especificada no existe.');
    }

    // Validar diente si se especificó
    if (data.diente_id) {
      const diente = await prisma.diente.findUnique({
        where: { id: data.diente_id }
      });

      if (!diente) {
        throw new Error('El diente especificado no existe.');
      }
    }

    // Crear el registro de práctica realizada
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
    return await prisma.detalle.delete({
      where: { id }
    });
  }
};
