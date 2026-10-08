import { z } from 'zod';

// ─── Bloques reutilizables ────────────────────────────────────────────────

export const EmailSchema = z.string().trim().email('Email inválido').max(100);

export const PasswordSchema = z
  .string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres');

export const TipoDocumentoSchema = z.enum(['DNI', 'Pasaporte']);

// Pasaporte puede tener letras, por eso no se valida sólo con dígitos
export const DocumentoSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9]{7,20}$/, 'Documento inválido (7 a 20 caracteres alfanuméricos)');

export const CuitSchema = z
  .string()
  .regex(/^\d{11}$/, 'CUIT debe tener 11 dígitos');

export const TelefonoSchema = z
  .string()
  .trim()
  .regex(/^[\d\-\+\s\(\)]{7,20}$/, 'Teléfono inválido')
  .optional();

// Para IDs que llegan como string desde la URL o query (cuando se valide params)
export const IdSchema = z.coerce.number().int().positive('ID inválido');

// ─── Paciente ─────────────────────────────────────────────────────────────

const PacienteBaseSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre requerido').max(50),
  apellido: z.string().trim().min(1, 'Apellido requerido').max(50),
  email: EmailSchema,
  direccion: z.string().trim().min(5, 'Dirección requerida').max(100),
  telefono: TelefonoSchema,
  nroDocumento: DocumentoSchema,
  tipoDoc: TipoDocumentoSchema,
});

// Endpoint público: el usuario envía su contraseña en texto plano
export const CreatePacienteSchema = PacienteBaseSchema.extend({
  password: PasswordSchema,
});

// Uso interno (seeds, importaciones, admin): recibe el hash ya generado
export const CreatePacienteInternoSchema = PacienteBaseSchema.extend({
  password_hash: z.string().min(1, 'password_hash requerido'),
});

// El email no se modifica desde paciente.service.update
export const UpdatePacienteSchema = PacienteBaseSchema.omit({ email: true }).partial();

// ─── Odontólogo ───────────────────────────────────────────────────────────

const OdontologoBaseSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre requerido').max(50),
  apellido: z.string().trim().min(1, 'Apellido requerido').max(50),
  email: EmailSchema,
  nro_Matricula: z.number().int().positive('Matrícula inválida'),
  especialidad: z.string().trim().min(3).max(50),
  telefono: TelefonoSchema,
  nroDocumento: DocumentoSchema,
  tipoDoc: TipoDocumentoSchema,
});

export const CreateOdontologoSchema = OdontologoBaseSchema.extend({
  password: PasswordSchema,
});

export const UpdateOdontologoSchema = OdontologoBaseSchema.omit({ email: true }).partial();

// ─── Mutual ───────────────────────────────────────────────────────────────

export const CreateMutualSchema = z.object({
  cuit: CuitSchema,
  nombre: z.string().trim().min(3).max(100),
});

export const UpdateMutualSchema = CreateMutualSchema.partial();

// Vincular mutual a paciente u odontólogo (el id de la mutual va en la URL)
export const AddMutualPacienteSchema = z.object({
  nroAfiliado: z.string().trim().min(1, 'Número de afiliado requerido').max(30),
  cubre: z.number().int().min(0).max(100).optional(),
});

export const AddMutualOdontologoSchema = z.object({
  nroAfiliado: z.string().trim().min(1, 'Número de afiliado requerido').max(30),
});

// ─── Práctica ─────────────────────────────────────────────────────────────

export const CreatePracticaSchema = z.object({
  codigo: z.string().trim().min(1).max(20),
  detalle: z.string().trim().min(5).max(100),
  precio: z.number().positive('Precio debe ser positivo').max(99999999.99),
});

export const UpdatePracticaSchema = CreatePracticaSchema.partial();

// ─── Diente y Cara ────────────────────────────────────────────────────────

export const CreateDienteSchema = z.object({
  numero: z.number().int().min(1, 'Número de diente inválido').max(127),
  nombre: z.string().trim().max(50).optional(),
  tipo: z.string().trim().min(1, 'Tipo requerido').max(30),
});

export const UpdateDienteSchema = CreateDienteSchema.partial();

export const CreateCaraSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre requerido').max(30),
  detalle: z.string().trim().max(100).optional(),
});

export const UpdateCaraSchema = CreateCaraSchema.partial();

// ─── Turno ────────────────────────────────────────────────────────────────

// Coincide con ESTADOS_TURNO en turno.service
export const EstadoTurnoSchema = z.enum(['libre', 'ocupado']);

export const CreateTurnoSchema = z.object({
  fecha_hora_inicio: z.coerce.date({ message: 'Fecha inválida' }),
  duracion: z.number().int().positive('La duración debe ser mayor a 0'),
  odontologo_id: z.number().int().positive(),
  estado: EstadoTurnoSchema.optional(),
});

export const UpdateTurnoSchema = CreateTurnoSchema.partial();

// ─── Reserva ──────────────────────────────────────────────────────────────

// Reserva un turno: el odontólogo se toma del turno, no se envía
export const CreateReservaSchema = z.object({
  paciente_id: z.number().int().positive(),
  turno_codigo: z.number().int().positive(),
  mutual_id: z.number().int().positive().optional(),
  observaciones: z.string().trim().max(255).optional(),
  coseguro: z.number().nonnegative().max(99999999.99).optional(),
});

export const CancelarReservaSchema = z.object({
  motivo: z.string().trim().max(255).optional(),
});

// Valores de ResultadoReserva en Prisma
export const ResultadoReservaSchema = z.enum(['exitoso', 'requiere_seguimiento', 'no_asistio']);

export const FinalizarReservaSchema = z.object({
  resultado: ResultadoReservaSchema,
  observaciones: z.string().trim().max(255).optional(),
});

// ─── Detalle (práctica realizada) ─────────────────────────────────────────

export const CreateDetalleSchema = z.object({
  reserva_id: z.number().int().positive(),
  practica_id: z.number().int().positive(),
  diente_id: z.number().int().positive().optional(),
  odontograma_id: z.number().int().positive().optional(),
  observaciones: z.string().trim().optional(),
});
