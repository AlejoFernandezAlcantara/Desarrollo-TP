export type TipoDocumento = 'DNI' | 'Pasaporte';

export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada' | 'realizada';

export type ResultadoReserva = 'exitoso' | 'requiere_seguimiento' | 'no_asistio';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  activo: number;
}

export interface Mutual {
  id: number;
  cuit: string;
  nombre: string;
}

export interface PacienteMutual {
  paciente_id: number;
  mutual_id: number;
  nroAfiliado: string;
  cubre: number;
  mutual?: Mutual;
}

export interface OdontologoMutual {
  odontologo_id: number;
  mutual_id: number;
  nroAfiliado: string;
  mutual?: Mutual;
}

export interface Paciente {
  id: number;
  nro_paciente: number;
  direccion: string;
  telefono?: string | null;
  nroDocumento: string;
  tipoDoc: TipoDocumento;
  usuario?: Usuario;
  mutuales?: PacienteMutual[];
  odontograma?: Odontograma;
}

export interface Odontologo {
  id: number;
  nro_Matricula: number;
  especialidad: string;
  telefono?: string | null;
  nroDocumento: string;
  tipoDoc: TipoDocumento;
  usuario?: Usuario;
  mutuales?: OdontologoMutual[];
  // Si viene mapeado desde el service
  nombreCompleto?: string;
  mutual?: string | null;
}

export interface Practica {
  id: number;
  codigo: string;
  detalle: string;
  precio: number | string;
}

export interface Turno {
  codigo: number;
  fecha_hora_inicio: string;
  duracion: number;
  estado: 'libre' | 'ocupado';
  odontologo_id: number;
  reserva_id?: number | null;
  odontologo?: Odontologo;
}

export interface Detalle {
  id: number;
  fecha_realizacion: string;
  observaciones?: string | null;
  odontograma_id: number;
  practica_id: number;
  diente_id?: number | null;
  reserva_id: number;
  practica?: Practica;
  diente?: Diente | null;
}

export interface Odontograma {
  id: number;
  fecha_creacion: string;
  estado: string;
  paciente_id: number;
  detalles?: Detalle[];
}

export interface Cara {
  id: number;
  nombre: string;
  detalle?: string | null;
}

export interface Diente {
  id: number;
  numero: number;
  nombre?: string | null;
  tipo: string;
  detalles?: Detalle[];
}

export interface Reserva {
  id_reserva: number;
  fecha_creacion: string;
  paciente_id: number;
  odontologo_id: number;
  mutual_id?: number | null;
  estado: EstadoReserva;
  observaciones?: string | null;
  coseguro?: number | string | null;
  fechaRealizacion?: string | null;
  resultado?: ResultadoReserva | null;
  paciente?: Paciente;
  odontologo?: Odontologo;
  mutual?: Mutual | null;
  turnos?: Turno[];
  detalles?: Detalle[];
}

export type UserRole = 'ADMINISTRADOR' | 'ODONTOLOGO' | 'PACIENTE';

export interface AuthUser {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: UserRole;
  personaId?: number;
}

export interface LoginResponse {
  mensaje: string;
  usuario: AuthUser;
}

export interface RegisterPacienteDTO {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  direccion: string;
  telefono?: string;
  nroDocumento: string;
  tipoDoc: TipoDocumento;
}
