import {
  Mutual,
  Practica,
  Odontologo,
  Paciente,
  Turno,
  Reserva,
  Detalle,
  Diente,
  ResultadoReserva,
  TipoDocumento,
  EstadoReserva,
  AuthUser,
  LoginResponse,
  RegisterPacienteDTO
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
  
  if (!response.ok) {
    let errorMsg = `Error HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      errorMsg = errJson.error || errJson.message || errorMsg;
    } catch {
      // response not JSON
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const payload: unknown = await response.json();
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    payload.success === true &&
    'data' in payload
  ) {
    return payload.data as T;
  }

  return payload as T;
}

// -------------------------------------------------------------------
// Mutuales
// -------------------------------------------------------------------
export const mutualesApi = {
  getAll: () => request<Mutual[]>('/mutuales'),
  getById: (id: number) => request<Mutual>(`/mutuales/${id}`),
  create: (data: { cuit: string; nombre: string }) =>
    request<Mutual>('/mutuales', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ cuit: string; nombre: string }>) =>
    request<Mutual>(`/mutuales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/mutuales/${id}`, { method: 'DELETE' })
};

// -------------------------------------------------------------------
// Prácticas
// -------------------------------------------------------------------
export const practicasApi = {
  getAll: () => request<Practica[]>('/practicas'),
  getById: (id: number) => request<Practica>(`/practicas/${id}`),
  create: (data: { codigo: string; detalle: string; precio: number }) =>
    request<Practica>('/practicas', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ codigo: string; detalle: string; precio: number }>) =>
    request<Practica>(`/practicas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/practicas/${id}`, { method: 'DELETE' })
};

// -------------------------------------------------------------------
// Odontólogos
// -------------------------------------------------------------------
export const odontologosApi = {
  getAll: (mutualId?: number) => {
    const query = mutualId ? `?mutualId=${mutualId}` : '';
    return request<Odontologo[]>(`/odontologos${query}`);
  },
  getById: (id: number) => request<Odontologo>(`/odontologos/${id}`),
  create: (data: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    nro_Matricula: number;
    especialidad: string;
    telefono?: string;
    nroDocumento: string;
    tipoDoc: TipoDocumento;
  }) =>
    request<Odontologo>('/odontologos', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  addMutual: (id: number, data: { mutual_id: number; nroAfiliado: string }) =>
    request<any>(`/odontologos/${id}/mutuales`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
};

// -------------------------------------------------------------------
// Pacientes
// -------------------------------------------------------------------
export const pacientesApi = {
  getAll: () => request<Paciente[]>('/pacientes'),
  getById: (id: number) => request<Paciente>(`/pacientes/${id}`),
  create: (data: {
    nombre: string;
    apellido: string;
    email: string;
    password_hash?: string;
    nro_paciente: number;
    direccion: string;
    telefono?: string;
    nroDocumento: string;
    tipoDoc: TipoDocumento;
    mutual_id?: number;
    nroAfiliado?: string;
    cubre?: number;
  }) => {
    const payload = {
      ...data,
      password_hash: data.password_hash || 'pass_paciente123'
    };
    return request<Paciente>('/pacientes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  update: (id: number, data: any) =>
    request<Paciente>(`/pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  delete: (id: number) => request<void>(`/pacientes/${id}`, { method: 'DELETE' }),
  addMutual: (id: number, data: { mutual_id: number; nroAfiliado: string; cubre?: number }) =>
    request<any>(`/pacientes/${id}/mutuales`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  removeMutual: (id: number, mutualId: number) =>
    request<void>(`/pacientes/${id}/mutuales/${mutualId}`, {
      method: 'DELETE'
    })
};

// -------------------------------------------------------------------
// Turnos
// -------------------------------------------------------------------
export const turnosApi = {
  getAll: (odontologoId?: number, estado?: string) => {
    const params = new URLSearchParams();
    if (odontologoId) params.append('odontologoId', odontologoId.toString());
    if (estado) params.append('estado', estado);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<Turno[]>(`/turnos${qs}`);
  },
  getDisponibles: (odontologoId?: number) => {
    const qs = odontologoId ? `?odontologoId=${odontologoId}` : '';
    return request<Turno[]>(`/turnos/disponibles${qs}`);
  },
  create: (data: {
    fecha_hora_inicio: string;
    duracion: number;
    odontologo_id: number;
  }) =>
    request<Turno>('/turnos', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (codigo: number, data: Partial<{ fecha_hora_inicio: string; duracion: number; estado: string }>) =>
    request<Turno>(`/turnos/${codigo}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  delete: (codigo: number) => request<void>(`/turnos/${codigo}`, { method: 'DELETE' })
};

// -------------------------------------------------------------------
// Reservas (CUU 1 y seguimiento)
// -------------------------------------------------------------------
export const reservasApi = {
  getAll: (params?: { pacienteId?: number; odontologoId?: number; estado?: EstadoReserva }) => {
    const searchParams = new URLSearchParams();
    if (params?.pacienteId) searchParams.append('pacienteId', params.pacienteId.toString());
    if (params?.odontologoId) searchParams.append('odontologoId', params.odontologoId.toString());
    if (params?.estado) searchParams.append('estado', params.estado);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<Reserva[]>(`/reservas${qs}`);
  },
  getById: (id: number) => request<Reserva>(`/reservas/${id}`),
  create: (data: {
    paciente_id: number;
    turno_codigo: number;
    mutual_id?: number;
    observaciones?: string;
    coseguro?: number;
  }) =>
    request<Reserva>('/reservas', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  cancelar: (id: number, motivo?: string) =>
    request<Reserva>(`/reservas/${id}/cancelar`, {
      method: 'PUT',
      body: JSON.stringify({ motivo })
    }),
  finalizar: (id: number, data: { resultado: ResultadoReserva; observaciones?: string }) =>
    request<Reserva>(`/reservas/${id}/finalizar`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
};

// -------------------------------------------------------------------
// Detalles de Atención (CUU 2 y Odontograma)
// -------------------------------------------------------------------
export const detallesApi = {
  getAll: (reservaId?: number, odontogramaId?: number) => {
    const params = new URLSearchParams();
    if (reservaId) params.append('reservaId', reservaId.toString());
    if (odontogramaId) params.append('odontogramaId', odontogramaId.toString());
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<Detalle[]>(`/detalles${qs}`);
  },
  create: (data: {
    reserva_id: number;
    practica_id: number;
    diente_id?: number;
    observaciones?: string;
    odontograma_id?: number;
  }) =>
    request<Detalle>('/detalles', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  delete: (id: number) => request<void>(`/detalles/${id}`, { method: 'DELETE' })
};

// -------------------------------------------------------------------
// Dientes
// -------------------------------------------------------------------
export const dientesApi = {
  getAll: () => request<Diente[]>('/dientes'),
  getById: (id: number) => request<Diente>(`/dientes/${id}`)
};

// -------------------------------------------------------------------
// Autenticación (JWT en cookies HttpOnly)
// -------------------------------------------------------------------
export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  registerPaciente: (data: RegisterPacienteDTO) =>
    request<LoginResponse>('/auth/register/paciente', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getMe: () => request<{ usuario: AuthUser }>('/auth/me'),
  logout: () =>
    request<{ mensaje: string }>('/auth/logout', {
      method: 'POST'
    })
};
