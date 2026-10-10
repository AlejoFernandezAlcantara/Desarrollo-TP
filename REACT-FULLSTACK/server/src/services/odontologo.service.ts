import { prisma } from '../lib/prisma';
import { TipoDocumento } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';
import { mutualService } from './mutual.service';
import { usuarioPublico } from '../utils/selects';

const assertId = (id: number) => {
  if (isNaN(id)) {
    throw new AppError(400, 'El ID ingresado es inválido');
  }
};

export const odontologoService = {
  async getAll(mutualId?: number) {
    if (mutualId !== undefined) {
      assertId(mutualId);

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

      // Mapear con la estructura solicitada (nombre del odontólogo y especialidad)
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
        usuario: { select: usuarioPublico },
        mutuales: {
          include: {
            mutual: true
          }
        }
      }
    });
  },

  async getById(id: number) { // puede devolver null
    return await prisma.odontologo.findUnique({
      where: { id },
      include: {
        usuario: { select: usuarioPublico }
      }
    });
  },

  async getByIdOrThrow(id: number) { // no puede devolver null, lanza error si no encuentra
    assertId(id);

    const odontologo = await this.getById(id);

    if (!odontologo) {
      throw new AppError(404, 'Odontólogo no encontrado');
    }

    return odontologo;
  },

  async getByEmail(email: string) {
    return await prisma.usuario.findUnique({
      where: { email },
      include: {
        odontologo: true
      }
    });
  },

  async addMutual(odontologo_id: number, data: { mutual_id: number; nroAfiliado: string }) {
    assertId(odontologo_id);
    assertId(data.mutual_id);

    await this.getByIdOrThrow(odontologo_id);
    await mutualService.getByIdOrThrow(data.mutual_id);

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

  async removeMutual(odontologo_id: number, mutual_id: number) {
  assertId(odontologo_id);
  assertId(mutual_id);

  await this.getByIdOrThrow(odontologo_id);

  const vinculo = await prisma.odontologoMutual.findUnique({
    where: {
      odontologo_id_mutual_id: {
        odontologo_id,
        mutual_id
      }
    }
  });

  if (!vinculo) {
    throw new AppError(404, 'El odontólogo no tiene asociada esa mutual');
  }

  return await prisma.odontologoMutual.delete({
    where: {
      odontologo_id_mutual_id: {
        odontologo_id,
        mutual_id
      }
    }
  });
},

  async create(data: {
    nombre: string;
    apellido: string;
    email: string;
    password?: string;
    password_hash?: string;
    nro_Matricula: number;
    especialidad: string;
    telefono?: string;
    nroDocumento: string;
    tipoDoc: TipoDocumento;
  }) {
    if (!data.email || !data.nroDocumento) {
      throw new AppError(400, 'Email y nroDocumento son requeridos');
    }

    let hashToStore = data.password_hash;
    if (data.password) {
      hashToStore = await bcrypt.hash(data.password, 10);
    }

    if (!hashToStore) {
      throw new AppError(400, 'Debes proporcionar una contraseña (password) para el odontólogo');
    }

    const existente = await this.getByEmail(data.email);
    if (existente) {
      logger.warn('Email ya registrado', { email: data.email });
      throw new AppError(400, 'El email ya está registrado');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Crear usuario
      const usuario = await tx.usuario.create({
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          password_hash: hashToStore
        }
      });

      // 2. Crear odontólogo vinculado
      return await tx.odontologo.create({
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
    await this.getByIdOrThrow(id);

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
    await this.getByIdOrThrow(id);

    // Al tener onDelete: Cascade en Prisma, eliminar el usuario también elimina el odontólogo
    return await prisma.usuario.delete({
      where: { id }
    });
  }
};