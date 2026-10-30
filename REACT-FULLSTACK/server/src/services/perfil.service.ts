import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/error.middleware';
import { AuthPayload } from '../middlewares/auth.middleware';
import { logger } from '../utils/logger';
import { usuarioPublico } from '../utils/selects';
import type { UpdatePerfilPacienteInput, UpdatePerfilOdontologoInput } from '../utils/validators';

const includeUsuario = { usuario: { select: usuarioPublico } } as const;

// En este sistema Paciente.id y Odontologo.id son el mismo id que Usuario.id,
// por eso alcanza con el id del token para encontrar los datos propios.
// El id NUNCA viene de la URL ni del body: un usuario solo puede ver/editar lo suyo.

const getPerfilPaciente = async (id: number) => {
  const p = await prisma.paciente.findUnique({ where: { id }, include: includeUsuario });
  if (!p) throw new AppError(404, 'Paciente no encontrado');

  return {
    rol: 'PACIENTE' as const,
    id: p.id,
    nombre: p.usuario.nombre,
    apellido: p.usuario.apellido,
    email: p.usuario.email,
    telefono: p.telefono,
    nroDocumento: p.nroDocumento,
    tipoDoc: p.tipoDoc,
    nro_paciente: p.nro_paciente,
    direccion: p.direccion,
  };
};

const getPerfilOdontologo = async (id: number) => {
  const o = await prisma.odontologo.findUnique({ where: { id }, include: includeUsuario });
  if (!o) throw new AppError(404, 'Odontólogo no encontrado');

  return {
    rol: 'ODONTOLOGO' as const,
    id: o.id,
    nombre: o.usuario.nombre,
    apellido: o.usuario.apellido,
    email: o.usuario.email,
    telefono: o.telefono,
    nroDocumento: o.nroDocumento,
    tipoDoc: o.tipoDoc,
    nro_Matricula: o.nro_Matricula,
    especialidad: o.especialidad,
  };
};

export const perfilService = {
  async getPerfil(user: AuthPayload) {
    if (user.rol === 'PACIENTE') return getPerfilPaciente(user.id);
    if (user.rol === 'ODONTOLOGO') return getPerfilOdontologo(user.id);

    throw new AppError(403, 'Tu rol no tiene un perfil editable');
  },

  async updatePaciente(id: number, data: UpdatePerfilPacienteInput) {
    await prisma.$transaction(async (tx) => {
      const existe = await tx.paciente.findUnique({ where: { id }, select: { id: true } });
      if (!existe) throw new AppError(404, 'Paciente no encontrado');

      if (data.nombre !== undefined || data.apellido !== undefined) {
        await tx.usuario.update({
          where: { id },
          data: { nombre: data.nombre, apellido: data.apellido },
        });
      }

      // Prisma ignora los campos undefined; telefono: null sí borra el teléfono
      await tx.paciente.update({
        where: { id },
        data: {
          direccion: data.direccion,
          telefono: data.telefono,
          nroDocumento: data.nroDocumento,
          tipoDoc: data.tipoDoc,
        },
      });
    });

    logger.info('Perfil de paciente actualizado', { pacienteId: id, cambios: Object.keys(data) });
    return getPerfilPaciente(id);
  },

  async updateOdontologo(id: number, data: UpdatePerfilOdontologoInput) {
    await prisma.$transaction(async (tx) => {
      const existe = await tx.odontologo.findUnique({ where: { id }, select: { id: true } });
      if (!existe) throw new AppError(404, 'Odontólogo no encontrado');

      if (data.nombre !== undefined || data.apellido !== undefined) {
        await tx.usuario.update({
          where: { id },
          data: { nombre: data.nombre, apellido: data.apellido },
        });
      }

      // nro_Matricula NO se incluye a propósito: la matrícula no se puede editar desde el perfil
      await tx.odontologo.update({
        where: { id },
        data: {
          especialidad: data.especialidad,
          telefono: data.telefono,
          nroDocumento: data.nroDocumento,
          tipoDoc: data.tipoDoc,
        },
      });
    });

    logger.info('Perfil de odontólogo actualizado', { odontologoId: id, cambios: Object.keys(data) });
    return getPerfilOdontologo(id);
  },

  async cambiarPassword(userId: number, passwordActual: string, passwordNueva: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, password_hash: true },
    });

    if (!usuario) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    const coincide = await bcrypt.compare(passwordActual, usuario.password_hash);
    if (!coincide) {
      logger.warn('Cambio de contraseña con contraseña actual incorrecta', { usuarioId: userId });
      // Se usa 400 y no 401: el front interpreta un 401 como sesión vencida y cierra la sesión
      throw new AppError(400, 'La contraseña actual es incorrecta');
    }

    const password_hash = await bcrypt.hash(passwordNueva, 10);
    await prisma.usuario.update({ where: { id: userId }, data: { password_hash } });

    logger.info('Contraseña actualizada', { usuarioId: userId });
  },
};