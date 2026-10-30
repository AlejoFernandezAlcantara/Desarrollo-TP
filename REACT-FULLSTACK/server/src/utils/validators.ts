import { z } from 'zod';

// ─── Bloques reutilizables ────────────────────────────────────────────────

export const EmailSchema = z.string().trim().email('Email inválido').max(100);

// bcrypt solo usa los primeros 72 bytes, por eso se limita el largo
export const PasswordSchema = z
  .string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres')
  .max(72, 'La contraseña no puede superar los 72 caracteres');

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
  // Mutual opcional al crear: si se envía mutual_id, nroAfiliado es obligatorio
  mutual_id: z.number().int().positive().optional(),
  nroAfiliado: z.string().trim().min(1, 'Número de afiliado requerido').max(30).optional(),
  cubre: z.number().int().min(0).max(100).optional(),
}).refine((d) => d.mutual_id === undefined || d.nroAfiliado !== undefined, {
  message: 'nroAfiliado es requerido cuando se envía mutual_id',
  path: ['nroAfiliado'],
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

// Estados válidos de un turno (los usa turno.service)
export const EstadoTurnoSchema = z.enum(['libre', 'ocupado']);

export const CreateTurnoSchema = z.object({
  fecha_hora_inicio: z
    .coerce
    .date({ message: 'Fecha inválida' })
    .refine((fecha) => fecha.getTime() > Date.now(), {
      message: 'No se puede crear un turno con fecha u hora en el pasado',
    }),
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

// El odontograma no se envía: siempre es el del paciente de la reserva
export const CreateDetalleSchema = z.object({
  reserva_id: z.number().int().positive(),
  practica_id: z.number().int().positive().optional(),
  practica_personalizada: z.string().trim().min(1).max(100).optional(),
  diente_id: z.number().int().positive().optional(),
  cara_id: z.number().int().positive().optional(), // cara del diente tratada (requiere diente_id)
  observaciones: z.string().trim().optional(),
}).refine(
  (data) => data.practica_id !== undefined || (data.practica_personalizada && data.practica_personalizada.trim().length > 0),
  {
    message: 'Debe seleccionar una práctica precargada o ingresar una práctica personalizada',
    path: ['practica_id']
  }
).refine((data) => data.cara_id === undefined || data.diente_id !== undefined, {
  message: 'Para indicar una cara hay que indicar también el diente',
  path: ['cara_id']
});

// ─── Usuario (gestión de cuentas, sólo administrador) ─────────────────────

export const CreateUsuarioSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre requerido').max(50),
  apellido: z.string().trim().min(1, 'Apellido requerido').max(50),
  email: EmailSchema,
  password: PasswordSchema,
});

// Los campos que no figuran acá (id, activo, password_hash...) se descartan
export const UpdateUsuarioSchema = CreateUsuarioSchema.partial();

// ─── Perfil (cada usuario edita sus propios datos) ────────────────────────

// Teléfono editable: un texto vacío o null borra el teléfono (se guarda NULL)
const TelefonoPerfilSchema = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
  z.string().trim().regex(/^[\d\-\+\s\(\)]{7,20}$/, 'Teléfono inválido').nullable().optional()
);

// Campos que el PACIENTE puede editar. No incluye email ni nro_paciente.
export const UpdatePerfilPacienteSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre requerido').max(50),
  apellido: z.string().trim().min(1, 'Apellido requerido').max(50),
  direccion: z.string().trim().min(5, 'Dirección requerida').max(100),
  telefono: TelefonoPerfilSchema,
  nroDocumento: DocumentoSchema,
  tipoDoc: TipoDocumentoSchema,
}).partial();

// Campos que el ODONTÓLOGO puede editar. No incluye email ni nro_Matricula.
export const UpdatePerfilOdontologoSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre requerido').max(50),
  apellido: z.string().trim().min(1, 'Apellido requerido').max(50),
  especialidad: z.string().trim().min(3, 'Especialidad requerida').max(50),
  telefono: TelefonoPerfilSchema,
  nroDocumento: DocumentoSchema,
  tipoDoc: TipoDocumentoSchema,
}).partial();

export type UpdatePerfilPacienteInput = z.infer<typeof UpdatePerfilPacienteSchema>;
export type UpdatePerfilOdontologoInput = z.infer<typeof UpdatePerfilOdontologoSchema>;

export const CambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'La contraseña actual es requerida'),
  passwordNueva: PasswordSchema,
}).refine((d) => d.passwordActual !== d.passwordNueva, {
  message: 'La nueva contraseña debe ser distinta a la actual',
  path: ['passwordNueva'],
});

// ─── Parámetros de URL ────────────────────────────────────────────────────

// Los params llegan como texto: se exige un entero positivo que entre en un INT de MySQL
const IdTextoSchema = z
  .string()
  .refine(
    (v) => /^\d{1,10}$/.test(v) && Number(v) >= 1 && Number(v) <= 2147483647,
    'debe ser un número entero positivo'
  );

export const IdParamsSchema = z.object({ id: IdTextoSchema });
export const CodigoParamsSchema = z.object({ codigo: IdTextoSchema });
export const MutualParamsSchema = z.object({ id: IdTextoSchema, mutualId: IdTextoSchema });
export const DienteParamsSchema = z.object({ dienteId: IdTextoSchema });
export const DienteCaraParamsSchema = z.object({ dienteId: IdTextoSchema, caraId: IdTextoSchema });

// ─── Filtros de query ─────────────────────────────────────────────────────

// El front puede mandar el filtro vacío (?estado=): se trata como "sin filtro", igual que hacen los controllers
const filtro = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

export const EstadoReservaSchema = z.enum(['pendiente', 'confirmada', 'cancelada', 'realizada']);

export const ReservaQuerySchema = z.object({
  pacienteId: filtro(IdTextoSchema),
  odontologoId: filtro(IdTextoSchema),
  estado: filtro(EstadoReservaSchema),
});

export const TurnoQuerySchema = z.object({
  odontologoId: filtro(IdTextoSchema),
  estado: filtro(EstadoTurnoSchema),
});

const fechaExiste = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  const f = new Date(Date.UTC(y, m - 1, d));
  return f.getUTCFullYear() === y && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
};

export const TurnoDisponiblesQuerySchema = z.object({
  odontologoId: filtro(IdTextoSchema),
  fecha: filtro(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'el formato debe ser YYYY-MM-DD')
      .refine(fechaExiste, 'la fecha no existe')
  ),
});

export const DetalleQuerySchema = z.object({
  reservaId: filtro(IdTextoSchema),
  odontogramaId: filtro(IdTextoSchema),
});

export const OdontologoQuerySchema = z.object({
  mutualId: filtro(IdTextoSchema),
});

// ─── Login ────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().trim().min(1, 'Email requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
});