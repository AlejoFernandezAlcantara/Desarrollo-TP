import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole, AuthPayload } from '../middlewares/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_consultorio_2026';

export interface UserResponse {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: UserRole;
  personaId?: number;
}

export const login = async (email: string, password: string): Promise<{ token: string; usuario: UserResponse }> => {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: {
      administrador: true,
      odontologo: true,
      paciente: true
    }
  });

if (usuario) {
}
  if (!usuario) {
    throw new Error('Credenciales inválidas');
  }

  if (!usuario.activo) {
    throw new Error('La cuenta de usuario se encuentra desactivada');
  }

  const passwordValido = await bcrypt.compare(password, usuario.password_hash);
  
  if (!passwordValido) {
    throw new Error('Credenciales inválidas');
  }

  // Determinar rol
  let rol: UserRole;
  let personaId: number | undefined;

  if (usuario.administrador) {
    rol = 'ADMINISTRADOR';
  } else if (usuario.odontologo) {
    rol = 'ODONTOLOGO';
    personaId = usuario.odontologo.id;
  } else if (usuario.paciente) {
    rol = 'PACIENTE';
    personaId = usuario.paciente.id;
  } else {
    throw new Error('El usuario no posee un rol asignado en el sistema');
  }

  const payload: AuthPayload = {
    id: usuario.id,
    email: usuario.email,
    rol,
    personaId
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol,
      personaId
    }
  };
};

export const getMe = async (userId: number): Promise<UserResponse> => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: {
      administrador: true,
      odontologo: true,
      paciente: true
    }
  });

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  let rol: UserRole;
  let personaId: number | undefined;

  if (usuario.administrador) {
    rol = 'ADMINISTRADOR';
  } else if (usuario.odontologo) {
    rol = 'ODONTOLOGO';
    personaId = usuario.odontologo.id;
  } else if (usuario.paciente) {
    rol = 'PACIENTE';
    personaId = usuario.paciente.id;
  } else {
    throw new Error('El usuario no posee un rol asignado');
  }

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    rol,
    personaId
  };
};

export interface RegisterPacienteData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  direccion: string;
  telefono?: string;
  nroDocumento: string;
  tipoDoc: 'DNI' | 'Pasaporte';
}

export const registerPaciente = async (data: RegisterPacienteData): Promise<{ token: string; usuario: UserResponse }> => {
  // 1. Validar si el email ya existe
  const normalizedEmail = data.email.toLowerCase().trim();
  const existingUser = await prisma.usuario.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    throw new Error('El correo electrónico ya se encuentra registrado');
  }

  // 2. Hashear password
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(data.password, salt);

  // 3. Crear usuario y paciente dentro de una transacción atómica
  const result = await prisma.$transaction(async (tx) => {
    // Obtener el mayor nro_paciente actual
    const maxPaciente = await tx.paciente.findFirst({
      orderBy: { nro_paciente: 'desc' },
      select: { nro_paciente: true }
    });
    const nuevoNroPaciente = (maxPaciente?.nro_paciente || 0) + 1;

    // Crear el usuario
    const nuevoUsuario = await tx.usuario.create({
      data: {
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        email: normalizedEmail,
        password_hash,
        activo: 1
      }
    });

    // Crear el paciente vinculado
    const nuevoPaciente = await tx.paciente.create({
      data: {
        id: nuevoUsuario.id,
        nro_paciente: nuevoNroPaciente,
        direccion: data.direccion.trim(),
        telefono: data.telefono ? data.telefono.trim() : null,
        nroDocumento: data.nroDocumento.trim(),
        tipoDoc: data.tipoDoc
      }
    });

    return { nuevoUsuario, nuevoPaciente };
  });

  // 4. Generar token JWT y sesión
  const payload: AuthPayload = {
    id: result.nuevoUsuario.id,
    email: result.nuevoUsuario.email,
    rol: 'PACIENTE',
    personaId: result.nuevoPaciente.id
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

  return {
    token,
    usuario: {
      id: result.nuevoUsuario.id,
      nombre: result.nuevoUsuario.nombre,
      apellido: result.nuevoUsuario.apellido,
      email: result.nuevoUsuario.email,
      rol: 'PACIENTE',
      personaId: result.nuevoPaciente.id
    }
  };
};
