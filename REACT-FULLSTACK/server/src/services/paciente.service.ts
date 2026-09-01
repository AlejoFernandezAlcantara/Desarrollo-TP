import { prisma } from '../lib/prisma';
import { TipoDocumento } from '@prisma/client';

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

  async getById(id: number) {
    return await prisma.paciente.findUnique({
      where: { id },
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
  },

  async create(data: {
    nombre: string;
    apellido: string;
    email: string;
    password_hash: string;
    nro_paciente: number;
    direccion: string;
    telefono?: string;
    nroDocumento: string;
    tipoDoc: TipoDocumento;
    mutual_id?: number;
    nroAfiliado?: string;
    cubre?: number;
  }) {
    // Validar rango de cubre (0 a 100) si se envía
    if (data.cubre !== undefined && (data.cubre < 0 || data.cubre > 100)) {
      throw new Error('El porcentaje de cobertura debe estar entre 0 y 100');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Crear usuario base
      const usuario = await tx.usuario.create({
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          password_hash: data.password_hash
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
    nro_paciente?: number;
    direccion?: string;
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

      return await tx.paciente.update({
        where: { id },
        data: {
          nro_paciente: data.nro_paciente,
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
    return await prisma.$transaction(async (tx) => {
      // Elimina el usuario en cascada, lo cual borra el paciente, paciente_mutual y odontograma
      return await tx.usuario.delete({
        where: { id }
      });
    });
  },

  async addMutual(paciente_id: number, data: { mutual_id: number; nroAfiliado: string; cubre?: number }) {
    if (data.cubre !== undefined && (data.cubre < 0 || data.cubre > 100)) {
      throw new Error('El porcentaje de cobertura debe estar entre 0 y 100');
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
