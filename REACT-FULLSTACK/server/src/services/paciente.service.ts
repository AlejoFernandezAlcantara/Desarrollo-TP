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

export const pacienteService = {
  async getAll() {
    return await prisma.paciente.findMany({
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

  async getById(id: number) { // puede devolver null
    return await prisma.paciente.findUnique({
      where: { id },
      include: {
        usuario: { select: usuarioPublico },
        mutuales: {
          include: {
            mutual: true
          }
        },
        odontograma: true
      }
    });
  },

  async getByIdOrThrow(id: number) { // no puede devolver null, lanza error si no encuentra
    assertId(id);

    const paciente = await this.getById(id);

    if (!paciente) {
      throw new AppError(404, 'Paciente no encontrado');
    }

    return paciente;
  },

  async getByEmail(email: string) {
    return await prisma.usuario.findUnique({
      where: { email },
      include: {
        paciente: true
      }
    });
  },

  async create(data: {
    nombre: string;
    apellido: string;
    email: string;
    password?: string;
    password_hash?: string;
    nro_paciente?: number;
    direccion: string;
    telefono?: string;
    nroDocumento: string;
    tipoDoc: TipoDocumento;
    mutual_id?: number;
    nroAfiliado?: string;
    cubre?: number;
  }) {
    if (!data.email || !data.nroDocumento) {
      throw new AppError(400, 'Email y nroDocumento son requeridos');
    }

    // Validar rango de cubre (0 a 100) si se envía
    if (data.cubre !== undefined && (data.cubre < 0 || data.cubre > 100)) {
      throw new AppError(400, 'El porcentaje de cobertura debe estar entre 0 y 100');
    }

    let hashToStore = data.password_hash;
    if (data.password) {
      hashToStore = await bcrypt.hash(data.password, 10);
    }

    if (!hashToStore) {
      throw new AppError(400, 'Debes proporcionar una contraseña (password) para el paciente');
    }

    const pacienteExistente = await this.getByEmail(data.email);
    if (pacienteExistente) {
      logger.warn('Email ya registrado', { email: data.email });
      throw new AppError(400, 'El email ya está registrado');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Crear usuario base
      const usuario = await tx.usuario.create({
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          password_hash: hashToStore
        }
      });

      // 2. Crear paciente vinculado
      const paciente = await tx.paciente.create({
        data: {
          id: usuario.id,
          nro_paciente: data.nro_paciente,
          direccion: data.direccion,
          telefono: data.telefono,
          nroDocumento: data.nroDocumento,
          tipoDoc: data.tipoDoc
        }
      });

      // 3. Si se especificó una mutual, crear la relación
      if (data.mutual_id && data.nroAfiliado) {
        await tx.pacienteMutual.create({
          data: {
            paciente_id: paciente.id,
            mutual_id: data.mutual_id,
            nroAfiliado: data.nroAfiliado,
            cubre: data.cubre ?? 0
          }
        });
      }

      // 4. Crear automáticamente el Odontograma inicial activo del paciente
      await tx.odontograma.create({
        data: {
          paciente_id: paciente.id,
          estado: 'Activo'
        }
      });

      // Devolver el paciente con todas sus relaciones
      return await tx.paciente.findUnique({
        where: { id: paciente.id },
        include: {
          usuario: true,
          mutuales: {
            include: {
              mutual: true
            }
          },
          odontograma: true
        }
      });
    });
  },

  async update(id: number, data: {
    nombre?: string;
    apellido?: string;
    direccion?: string;
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

      return await tx.paciente.update({
        where: { id },
        data: {
          direccion: data.direccion,
          telefono: data.telefono,
          nroDocumento: data.nroDocumento,
          tipoDoc: data.tipoDoc
        },
        include: {
          usuario: true,
          mutuales: {
            include: {
              mutual: true
            }
          }
        }
      });
    });
  },

  async delete(id: number) {
    assertId(id);

    return await prisma.$transaction(async (tx) => {
      // Elimina el usuario en cascada, lo cual borra el paciente, paciente_mutual y odontograma
      const paciente = await tx.paciente.findUnique({
        where: { id }
      });

      if (!paciente) {
        logger.warn('Paciente no encontrado para eliminar', { id });
        throw new AppError(404, 'Paciente no encontrado. No se puede eliminar');
      }

      return await tx.usuario.delete({
        where: { id }
      });
    });
  },

  async addMutual(paciente_id: number, data: { mutual_id: number; nroAfiliado: string; cubre?: number }) {
    assertId(paciente_id);
    assertId(data.mutual_id);

    await this.getByIdOrThrow(paciente_id);
    await mutualService.getByIdOrThrow(data.mutual_id);

    if (data.cubre !== undefined && (data.cubre < 0 || data.cubre > 100)) {
      throw new AppError(400, 'El porcentaje de cobertura debe estar entre 0 y 100');
    }

    return await prisma.pacienteMutual.upsert({
      where: {
        paciente_id_mutual_id: {
          paciente_id,
          mutual_id: data.mutual_id
        }
      },
      update: {
        nroAfiliado: data.nroAfiliado,
        cubre: data.cubre ?? 0
      },
      create: {
        paciente_id,
        mutual_id: data.mutual_id,
        nroAfiliado: data.nroAfiliado,
        cubre: data.cubre ?? 0
      },
      include: {
        mutual: true
      }
    });
  },

  async removeMutual(paciente_id: number, mutual_id: number) {
  assertId(paciente_id);
  assertId(mutual_id);

  await this.getByIdOrThrow(paciente_id);

  const vinculo = await prisma.pacienteMutual.findUnique({
    where: {
      paciente_id_mutual_id: {
        paciente_id,
        mutual_id
      }
    }
  });

  if (!vinculo) {
    throw new AppError(404, 'El paciente no tiene asociada esa mutual');
  }

  return await prisma.pacienteMutual.delete({
    where: {
      paciente_id_mutual_id: {
        paciente_id,
        mutual_id
      }
    }
  });
}
};