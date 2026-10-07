import { z } from 'zod';

// Esquemas de validación
export const EmailSchema = z.string().email('Email inválido');

export const PasswordSchema = z
  .string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres');

export const TipoDocumentoSchema = z.enum(['DNI', 'Pasaporte']);

export const DocumentoSchema = z.string().regex(/^\d{7,8}$/, 'DNI inválido');

export const CuitSchema = z
  .string()
  .regex(/^\d{11}$/, 'CUIT debe tener 11 dígitos');

export const TelefonoSchema = z
  .string()
  .regex(/^[\d\-\+\s\(\)]{7,}$/, 'Teléfono inválido')
  .optional();

// Esquemas de entidades
export const CreatePacienteSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(50),
  apellido: z.string().min(1, 'Apellido requerido').max(50),
  email: EmailSchema,
  password: PasswordSchema,
  direccion: z.string().min(5, 'Dirección requerida').max(100),
  telefono: TelefonoSchema,
  nroDocumento: DocumentoSchema,
  tipoDoc: TipoDocumentoSchema,
});

export const CreateOdontologoSchema = z.object({
  nombre: z.string().min(1).max(50),
  apellido: z.string().min(1).max(50),
  email: EmailSchema,
  password: PasswordSchema,
  nro_Matricula: z.number().positive('Matrícula inválida'),
  especialidad: z.string().min(3).max(50),
  telefono: TelefonoSchema,
  nroDocumento: DocumentoSchema,
  tipoDoc: TipoDocumentoSchema,
});

export const CreateMutualSchema = z.object({
  cuit: CuitSchema,
  nombre: z.string().min(3).max(100),
});

export const CreatePracticaSchema = z.object({
  codigo: z.string().min(1).max(20),
  detalle: z.string().min(5).max(100),
  precio: z.number().positive('Precio debe ser positivo'),
});

export const CreateReservaSchema = z.object({
  paciente_id: z.number().positive(),
  odontologo_id: z.number().positive(),
  mutual_id: z.number().positive().optional(),
  observaciones: z.string().max(255).optional(),
  coseguro: z.number().optional(),
});

