import { prisma } from '../lib/prisma';
import { TipoDocumento } from '@prisma/client';

export const odontologoService = {
  async getAll(mutualId?: number) {
    if (mutualId) {
      const odontologos = await prisma.odontologo.findMany({
        where: {
          mutuales: {
            some: {
              mutual_id: mutualId
            }
          }
        },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true
            }
          },
          mutuales: {
            where: { mutual_id: mutualId },
            include: { mutual: true }
          }
        }
      });

      // Mapear con la estructura solicitada (nombre del odontologo y especialidades)
      return odontologos.map((o) => ({
        id: o.id,
        nombreCompleto: `${o.usuario.nombre} ${o.usuario.apellido}`,
        especialidad: o.especialidad,
        nro_Matricula: o.nro_Matricula,
        mutual: o.mutuales[0]?.mutual?.nombre || null
      }));
    }

    return await prisma.odontologo.findMany({
      include: {
        usuario: true,
        mutuales: {
          include: {
            mutual: true
          }
        }
      }
    });
  },

  async addMutual(odontologo_id: number, data: { mutual_id: number; nroAfiliado: string }) {
    return await prisma.odontologoMutual.upsert({
      where: {
        odontologo_id_mutual_id: {
          odontologo_id,
          mutual_id: data.mutual_id
        }
      },
      update: {
        nroAfiliado: data.nroAfiliado
      },
      create: {
        odontologo_id,
        mutual_id: data.mutual_id,
        nroAfiliado: data.nroAfiliado
      },
      include: {
        mutual: true
      }
    });
  },

  async getById(id: number) {
    return await prisma.odontologo.findUnique({
      where: { id },
      include: {
        usuario: true
      }
    });
  },

  async create(data: {
    nombre: string;
    apellido: string;
    email: string;
    password_hash: string;
    nro_Matricula: number;
    especialidad: string;
    telefono?: string;
    nroDocumento: string;
    tipoDoc: TipoDocumento;
  }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Crear usuario
      const usuario = await tx.usuario.create({
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          password_hash: data.password_hash
        }
      });

      // 2. Crear odontologo vinculado
      const odontologo = await tx.odontologo.create({
        data: {
          id: usuario.id,
          nro_Matricula: data.nro_Matricula,
          especialidad: data.especialidad,
          telefono: data.telefono,
          nroDocumento: data.nroDocumento,
          tipoDoc: data.tipoDoc
        },
        include: {
          usuario: true
        }
      });

      return odontologo;
    });
  },

  async update(id: number, data: {
    nombre?: string;
    apellido?: string;
    nro_Matricula?: number;
    especialidad?: string;
    telefono?: string;
    nroDocumento?: string;
    tipoDoc?: TipoDocumento;
  }) {
    return await prisma.$transaction(async (tx) => {
      if (data.nombre || data.apellido) {
        await tx.usuario.update({
          where: { id },
          data: {
            nombre: data.nombre,
            apellido: data.apellido
          }
        });
      }

      return await tx.odontologo.update({
        where: { id },
        data: {
          nro_Matricula: data.nro_Matricula,
          especialidad: data.especialidad,
          telefono: data.telefono,
          nroDocumento: data.nroDocumento,
          tipoDoc: data.tipoDoc
        },
        include: {
          usuario: true
        }
      });
    });
  },

  async delete(id: number) {
    return await prisma.$transaction(async (tx) => {
      // Al tener onDelete: Cascade en Prisma, eliminar el usuario también eliminará el odontólogo.
      // Así que eliminamos desde el usuario.
      return await tx.usuario.delete({
        where: { id }
      });
    });
  }
};
