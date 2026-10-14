// Documentación OpenAPI 3 de la API. Se sirve en /api/docs.
// Los roles y las rutas reflejan los archivos de routes/ tal como quedaron en el proyecto.

const ok = (schema: object, descripcion = 'OK') => ({
  description: descripcion,
  content: {
    'application/json': {
      schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: schema } }
    }
  }
});

const okLista = (schema: object) => ({
  description: 'Lista de resultados',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: schema },
          total: { type: 'integer', example: 1 }
        }
      }
    }
  }
});

const created = (schema: object) => ({
  description: 'Creado',
  content: {
    'application/json': {
      schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: schema } }
    }
  }
});

const noContent = { description: 'Eliminado (sin contenido)' };

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const refList = (name: string) => ({ type: 'array', items: ref(name) });

const idPath = (name = 'id', descripcion = 'ID numérico') => ({
  name,
  in: 'path',
  required: true,
  description: descripcion,
  schema: { type: 'integer', minimum: 1, example: 1 }
});

const jsonBody = (name: string) => ({
  required: true,
  content: { 'application/json': { schema: ref(name) } }
});

const err = (descripcion: string) => ({
  description: descripcion,
  content: { 'application/json': { schema: ref('Error') } }
});

const ERR_AUTH = { 401: err('Sin sesión o token inválido/vencido'), 403: err('El rol no tiene permiso para esta acción') };
const ERR_VALID = { 400: err('Datos inválidos (ver el campo error)') };
const ERR_NOTFOUND = { 404: err('No encontrado') };

const SEG = { cookieAuth: [] as string[] };
const PUBLICO: [] = [];

const ROLES_STAFF = 'Roles: ODONTOLOGO, ADMINISTRADOR';
const SOLO_ADMIN = 'Roles: ADMINISTRADOR';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'API Consultorio Odontológico',
    version: '1.0.0',
    description:
      'API del sistema de consultorio. La autenticación usa una cookie HttpOnly `token` (se obtiene con POST /auth/login). ' +
      'Las respuestas exitosas tienen la forma `{ success, data }` y los errores `{ success: false, error, timestamp }`. ' +
      'Las fechas se guardan y devuelven en UTC; el front debe mostrarlas en hora de Argentina.'
  },
  servers: [{ url: '/api', description: 'Servidor actual' }],
  tags: [
    { name: 'Auth', description: 'Inicio y cierre de sesión, registro público de pacientes' },
    { name: 'Usuarios', description: 'Gestión de cuentas (sólo administrador)' },
    { name: 'Pacientes', description: 'Pacientes y sus mutuales' },
    { name: 'Odontólogos', description: 'Odontólogos y sus mutuales' },
    { name: 'Mutuales', description: 'Obras sociales' },
    { name: 'Prácticas', description: 'Catálogo de prácticas odontológicas' },
    { name: 'Dientes', description: 'Catálogo de dientes' },
    { name: 'Caras', description: 'Caras del diente y su vínculo con cada diente' },
    { name: 'Turnos', description: 'Agenda de turnos de los odontólogos' },
    { name: 'Reservas', description: 'Reservas de turnos y su seguimiento' },
    { name: 'Detalles', description: 'Prácticas realizadas en una consulta (historia clínica)' }
  ],

  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'token', description: 'Cookie HttpOnly emitida por POST /auth/login' },
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Alternativa: header Authorization: Bearer <token>' }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Turno no encontrado' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      Rol: { type: 'string', enum: ['ADMINISTRADOR', 'ODONTOLOGO', 'PACIENTE'] },
      TipoDocumento: { type: 'string', enum: ['DNI', 'Pasaporte'] },
      EstadoReserva: { type: 'string', enum: ['pendiente', 'confirmada', 'cancelada', 'realizada'] },
      ResultadoReserva: { type: 'string', enum: ['exitoso', 'requiere_seguimiento', 'no_asistio'] },
      EstadoTurno: { type: 'string', enum: ['libre', 'ocupado'] },

      Usuario: {
        type: 'object',
        description: 'Usuario sin password_hash',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Ana' },
          apellido: { type: 'string', example: 'Gómez' },
          email: { type: 'string', format: 'email' },
          activo: { type: 'integer', example: 1 }
        }
      },
      UsuarioPublico: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          email: { type: 'string', format: 'email' }
        }
      },
      Mutual: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          cuit: { type: 'string', example: '30111222333' },
          nombre: { type: 'string', example: 'OSDE' }
        }
      },
      PacienteMutual: {
        type: 'object',
        properties: {
          paciente_id: { type: 'integer' },
          mutual_id: { type: 'integer' },
          nroAfiliado: { type: 'string', example: 'A-123' },
          cubre: { type: 'integer', minimum: 0, maximum: 100, example: 80 },
          mutual: ref('Mutual')
        }
      },
      OdontologoMutual: {
        type: 'object',
        properties: {
          odontologo_id: { type: 'integer' },
          mutual_id: { type: 'integer' },
          nroAfiliado: { type: 'string' },
          mutual: ref('Mutual')
        }
      },
      Paciente: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 3 },
          nro_paciente: { type: 'integer', example: 7, description: 'Número de ficha, asignado automáticamente' },
          direccion: { type: 'string' },
          telefono: { type: 'string', nullable: true },
          nroDocumento: { type: 'string', example: '30111222' },
          tipoDoc: ref('TipoDocumento'),
          usuario: ref('UsuarioPublico'),
          mutuales: refList('PacienteMutual')
        }
      },
      Odontologo: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 2 },
          nro_Matricula: { type: 'integer', example: 45891 },
          especialidad: { type: 'string', example: 'Ortodoncia' },
          telefono: { type: 'string', nullable: true },
          nroDocumento: { type: 'string' },
          tipoDoc: ref('TipoDocumento'),
          usuario: ref('UsuarioPublico'),
          mutuales: refList('OdontologoMutual')
        }
      },
      OdontologoResumen: {
        type: 'object',
        description: 'Datos públicos de un odontólogo (los que devuelve /turnos/disponibles)',
        properties: {
          id: { type: 'integer' },
          nombreCompleto: { type: 'string', example: 'Juan Pérez' },
          especialidad: { type: 'string' },
          mutuales: refList('OdontologoMutual')
        }
      },

      Practica: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          codigo: { type: 'string', example: 'LIM01' },
          detalle: { type: 'string', example: 'Limpieza dental' },
          precio: { type: 'number', example: 1500 }
        }
      },
      Diente: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          numero: { type: 'integer', example: 11 },
          nombre: { type: 'string', nullable: true, example: 'Incisivo central' },
          tipo: { type: 'string', example: 'Permanente' }
        }
      },
      Cara: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nombre: { type: 'string', example: 'Vestibular' },
          detalle: { type: 'string', nullable: true }
        }
      },
      Turno: {
        type: 'object',
        properties: {
          codigo: { type: 'integer', example: 15 },
          fecha_hora_inicio: { type: 'string', format: 'date-time', example: '2026-10-20T17:00:00.000Z' },
          duracion: { type: 'integer', example: 30, description: 'Minutos' },
          estado: ref('EstadoTurno'),
          odontologo_id: { type: 'integer' },
          reserva_id: { type: 'integer', nullable: true },
          odontologo: { type: 'object', description: 'Incluye usuario sin password_hash' }
        }
      },
      TurnoDisponible: {
        type: 'object',
        properties: {
          codigo: { type: 'integer' },
          fecha_hora_inicio: { type: 'string', format: 'date-time' },
          duracion: { type: 'integer' },
          estado: ref('EstadoTurno'),
          odontologo: ref('OdontologoResumen')
        }
      },
      Reserva: {
        type: 'object',
        properties: {
          id_reserva: { type: 'integer' },
          paciente_id: { type: 'integer' },
          odontologo_id: { type: 'integer' },
          mutual_id: { type: 'integer', nullable: true },
          fecha_creacion: { type: 'string', format: 'date-time' },
          estado: ref('EstadoReserva'),
          observaciones: { type: 'string', nullable: true },
          coseguro: { type: 'number', nullable: true },
          fechaRealizacion: { type: 'string', format: 'date-time', nullable: true },
          resultado: { ...ref('ResultadoReserva'), nullable: true },
          turnos: refList('Turno')
        }
      },
      Detalle: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          fecha_realizacion: { type: 'string', format: 'date-time' },
          observaciones: { type: 'string', nullable: true },
          odontograma_id: { type: 'integer', description: 'Lo asigna el servidor a partir de la reserva' },
          practica_id: { type: 'integer' },
          diente_id: { type: 'integer', nullable: true },
          reserva_id: { type: 'integer' },
          practica: ref('Practica'),
          diente: ref('Diente')
        }
      },

      // ── Cuerpos de las peticiones ──────────────────────────────
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'paciente@consultorio.com' },
          password: { type: 'string', example: 'Paciente123!' }
        }
      },
      RegisterPacienteRequest: {
        type: 'object',
        required: ['nombre', 'apellido', 'email', 'password', 'direccion', 'nroDocumento', 'tipoDoc'],
        properties: {
          nombre: { type: 'string', maxLength: 50 },
          apellido: { type: 'string', maxLength: 50 },
          email: { type: 'string', format: 'email', maxLength: 100 },
          password: { type: 'string', minLength: 6, maxLength: 72 },
          direccion: { type: 'string', minLength: 5, maxLength: 100 },
          telefono: { type: 'string', example: '1145678901' },
          nroDocumento: { type: 'string', example: '30111222', description: '7 a 20 caracteres alfanuméricos' },
          tipoDoc: ref('TipoDocumento'),
          mutual_id: { type: 'integer', description: 'Opcional. Si se envía, nroAfiliado es obligatorio' },
          nroAfiliado: { type: 'string', maxLength: 30 },
          cubre: { type: 'integer', minimum: 0, maximum: 100 }
        }
      },
      CreatePacienteRequest: {
        allOf: [ref('RegisterPacienteRequest')],
        description: 'Alta de paciente por el administrador (mismos campos que el registro público)'
      },
      UpdatePacienteRequest: {
        type: 'object',
        description: 'Campos opcionales. El email no se modifica desde aquí.',
        properties: {
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          direccion: { type: 'string' },
          telefono: { type: 'string' },
          nroDocumento: { type: 'string' },
          tipoDoc: ref('TipoDocumento')
        }
      },
      CreateOdontologoRequest: {
        type: 'object',
        required: ['nombre', 'apellido', 'email', 'password', 'nro_Matricula', 'especialidad', 'nroDocumento', 'tipoDoc'],
        properties: {
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          nro_Matricula: { type: 'integer', example: 45891 },
          especialidad: { type: 'string', minLength: 3, maxLength: 50 },
          telefono: { type: 'string' },
          nroDocumento: { type: 'string' },
          tipoDoc: ref('TipoDocumento')
        }
      },
      UpdateOdontologoRequest: {
        type: 'object',
        description: 'Campos opcionales. El email no se modifica desde aquí.',
        properties: {
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          nro_Matricula: { type: 'integer' },
          especialidad: { type: 'string' },
          telefono: { type: 'string' },
          nroDocumento: { type: 'string' },
          tipoDoc: ref('TipoDocumento')
        }
      },
      CreateUsuarioRequest: {
        type: 'object',
        required: ['nombre', 'apellido', 'email', 'password'],
        properties: {
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      UpdateUsuarioRequest: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      CreateMutualRequest: {
        type: 'object',
        required: ['cuit', 'nombre'],
        properties: {
          cuit: { type: 'string', example: '30111222333', description: '11 dígitos, único' },
          nombre: { type: 'string', minLength: 3, maxLength: 100 }
        }
      },
      UpdateMutualRequest: {
        type: 'object',
        properties: { cuit: { type: 'string' }, nombre: { type: 'string' } }
      },
      AddMutualPacienteRequest: {
        type: 'object',
        required: ['nroAfiliado'],
        properties: {
          nroAfiliado: { type: 'string', maxLength: 30 },
          cubre: { type: 'integer', minimum: 0, maximum: 100, description: 'Porcentaje que cubre la mutual' }
        }
      },
      AddMutualOdontologoRequest: {
        type: 'object',
        required: ['nroAfiliado'],
        properties: { nroAfiliado: { type: 'string', maxLength: 30 } }
      },
      CreatePracticaRequest: {
        type: 'object',
        required: ['codigo', 'detalle', 'precio'],
        properties: {
          codigo: { type: 'string', maxLength: 20 },
          detalle: { type: 'string', minLength: 5, maxLength: 100 },
          precio: { type: 'number', exclusiveMinimum: 0 }
        }
      },
      UpdatePracticaRequest: {
        type: 'object',
        properties: {
          codigo: { type: 'string' },
          detalle: { type: 'string' },
          precio: { type: 'number' }
        }
      },
      CreateDienteRequest: {
        type: 'object',
        required: ['numero', 'tipo'],
        properties: {
          numero: { type: 'integer', minimum: 1, maximum: 127 },
          nombre: { type: 'string', maxLength: 50 },
          tipo: { type: 'string', maxLength: 30 }
        }
      },
      UpdateDienteRequest: {
        type: 'object',
        properties: {
          numero: { type: 'integer' },
          nombre: { type: 'string' },
          tipo: { type: 'string' }
        }
      },
      CreateCaraRequest: {
        type: 'object',
        required: ['nombre'],
        properties: {
          nombre: { type: 'string', maxLength: 30 },
          detalle: { type: 'string', maxLength: 100 }
        }
      },
      UpdateCaraRequest: {
        type: 'object',
        properties: { nombre: { type: 'string' }, detalle: { type: 'string' } }
      },
      CreateTurnoRequest: {
        type: 'object',
        required: ['fecha_hora_inicio', 'duracion', 'odontologo_id'],
        properties: {
          fecha_hora_inicio: { type: 'string', format: 'date-time', description: 'Debe ser futura' },
          duracion: { type: 'integer', minimum: 1, example: 30, description: 'Minutos' },
          odontologo_id: { type: 'integer' },
          estado: ref('EstadoTurno')
        }
      },
      UpdateTurnoRequest: {
        type: 'object',
        description: 'Un turno con reserva asociada no se puede modificar',
        properties: {
          fecha_hora_inicio: { type: 'string', format: 'date-time' },
          duracion: { type: 'integer', minimum: 1 },
          odontologo_id: { type: 'integer' },
          estado: ref('EstadoTurno')
        }
      },
      CreateReservaRequest: {
        type: 'object',
        required: ['paciente_id', 'turno_codigo'],
        description: 'El odontólogo se toma del turno. Un paciente sólo puede reservar para sí mismo.',
        properties: {
          paciente_id: { type: 'integer' },
          turno_codigo: { type: 'integer' },
          mutual_id: { type: 'integer' },
          observaciones: { type: 'string', maxLength: 255 },
          coseguro: { type: 'number', minimum: 0 }
        }
      },
      CancelarReservaRequest: {
        type: 'object',
        properties: { motivo: { type: 'string', maxLength: 255 } }
      },
      FinalizarReservaRequest: {
        type: 'object',
        required: ['resultado'],
        properties: {
          resultado: ref('ResultadoReserva'),
          observaciones: { type: 'string', maxLength: 255 }
        }
      },
      CreateDetalleRequest: {
        type: 'object',
        required: ['reserva_id'],
        description: 'Indicar practica_id o practica_personalizada. El odontograma se toma del paciente de la reserva.',
        properties: {
          reserva_id: { type: 'integer' },
          practica_id: { type: 'integer' },
          practica_personalizada: { type: 'string', maxLength: 100 },
          diente_id: { type: 'integer' },
          observaciones: { type: 'string' }
        }
      }
    }
  },

  paths: {
    // ─────────────────────────── AUTH ───────────────────────────
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión',
        description: 'Emite la cookie `token` (HttpOnly, 24 h).',
        security: PUBLICO,
        requestBody: jsonBody('LoginRequest'),
        responses: {
          200: {
            description: 'Sesión iniciada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    mensaje: { type: 'string' },
                    usuario: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        nombre: { type: 'string' },
                        apellido: { type: 'string' },
                        email: { type: 'string' },
                        rol: ref('Rol'),
                        personaId: { type: 'integer', nullable: true }
                      }
                    }
                  }
                }
              }
            }
          },
          ...ERR_VALID,
          401: err('Credenciales inválidas o cuenta desactivada')
        }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Cerrar sesión',
        description: 'Borra la cookie `token`.',
        security: PUBLICO,
        responses: { 200: { description: 'Sesión cerrada' } }
      }
    },
    '/auth/register/paciente': {
      post: {
        tags: ['Auth'],
        summary: 'Registro público de paciente',
        description: 'Crea el usuario y el paciente, y deja la sesión iniciada. Acepta obra social opcional.',
        security: PUBLICO,
        requestBody: jsonBody('RegisterPacienteRequest'),
        responses: {
          201: { description: 'Paciente registrado y sesión iniciada' },
          ...ERR_VALID,
          404: err('La mutual indicada no existe')
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Usuario de la sesión actual',
        security: [SEG],
        responses: {
          200: { description: 'Datos del usuario logueado' },
          401: err('Sin sesión')
        }
      }
    },

    // ─────────────────────────── USUARIOS ───────────────────────────
    '/usuarios': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar usuarios',
        description: SOLO_ADMIN,
        security: [SEG],
        responses: { 200: { description: 'Lista de usuarios' }, ...ERR_AUTH }
      },
      post: {
        tags: ['Usuarios'],
        summary: 'Crear usuario',
        description: SOLO_ADMIN,
        security: [SEG],
        requestBody: jsonBody('CreateUsuarioRequest'),
        responses: { 201: { description: 'Usuario creado' }, ...ERR_AUTH, ...ERR_VALID }
      }
    },
    '/usuarios/{id}': {
      parameters: [idPath()],
      get: {
        tags: ['Usuarios'],
        summary: 'Obtener usuario',
        description: SOLO_ADMIN,
        security: [SEG],
        responses: { 200: { description: 'Usuario' }, ...ERR_AUTH, ...ERR_NOTFOUND }
      },
      put: {
        tags: ['Usuarios'],
        summary: 'Actualizar usuario',
        description: SOLO_ADMIN,
        security: [SEG],
        requestBody: jsonBody('UpdateUsuarioRequest'),
        responses: { 200: { description: 'Usuario actualizado' }, ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      },
      delete: {
        tags: ['Usuarios'],
        summary: 'Eliminar usuario',
        description: SOLO_ADMIN,
        security: [SEG],
        responses: { 204: noContent, ...ERR_AUTH, ...ERR_NOTFOUND }
      }
    },

    // ─────────────────────────── PACIENTES ───────────────────────────
    '/pacientes': {
      get: {
        tags: ['Pacientes'],
        summary: 'Listar pacientes',
        description: ROLES_STAFF,
        security: [SEG],
        responses: { 200: okLista(ref('Paciente')), ...ERR_AUTH }
      },
      post: {
        tags: ['Pacientes'],
        summary: 'Alta de paciente (administrador)',
        description: SOLO_ADMIN,
        security: [SEG],
        requestBody: jsonBody('CreatePacienteRequest'),
        responses: { 201: created(ref('Paciente')), ...ERR_AUTH, ...ERR_VALID }
      }
    },
    '/pacientes/{id}': {
      parameters: [idPath()],
      get: {
        tags: ['Pacientes'],
        summary: 'Obtener paciente',
        description: 'Roles: PACIENTE (sólo su propia ficha), ODONTOLOGO, ADMINISTRADOR',
        security: [SEG],
        responses: { 200: ok(ref('Paciente')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      },
      put: {
        tags: ['Pacientes'],
        summary: 'Actualizar paciente',
        description: SOLO_ADMIN,
        security: [SEG],
        requestBody: jsonBody('UpdatePacienteRequest'),
        responses: { 200: ok(ref('Paciente')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      },
      delete: {
        tags: ['Pacientes'],
        summary: 'Eliminar paciente',
        description: SOLO_ADMIN,
        security: [SEG],
        responses: { 204: noContent, ...ERR_AUTH, ...ERR_NOTFOUND }
      }
    },
    '/pacientes/{id}/mutuales': {
      parameters: [idPath('id', 'ID del paciente')],
      get: {
        tags: ['Pacientes'],
        summary: 'Listar mutuales asociadas al paciente',
        description: 'Roles: PACIENTE (sólo la propia), ODONTOLOGO, ADMINISTRADOR',
        security: [SEG],
        responses: { 200: okLista(ref('PacienteMutual')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      }
    },
    '/pacientes/{id}/mutuales/{mutualId}': {
      parameters: [idPath('id', 'ID del paciente'), idPath('mutualId', 'ID de la mutual')],
      post: {
        tags: ['Pacientes'],
        summary: 'Vincular mutual al paciente',
        description: SOLO_ADMIN,
        security: [SEG],
        requestBody: jsonBody('AddMutualPacienteRequest'),
        responses: { 200: ok(ref('PacienteMutual')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      },
      delete: {
        tags: ['Pacientes'],
        summary: 'Desvincular mutual del paciente',
        description: SOLO_ADMIN,
        security: [SEG],
        responses: { 204: noContent, ...ERR_AUTH, ...ERR_NOTFOUND }
      }
    },

    // ─────────────────────────── ODONTÓLOGOS ───────────────────────────
    '/odontologos': {
      get: {
        tags: ['Odontólogos'],
        summary: 'Listar odontólogos',
        description: ROLES_STAFF + '. Con mutualId devuelve sólo los que atienden esa mutual.',
        security: [SEG],
        parameters: [{ name: 'mutualId', in: 'query', required: false, schema: { type: 'integer' } }],
        responses: { 200: okLista(ref('Odontologo')), ...ERR_AUTH, ...ERR_VALID }
      },
      post: {
        tags: ['Odontólogos'],
        summary: 'Alta de odontólogo',
        description: SOLO_ADMIN,
        security: [SEG],
        requestBody: jsonBody('CreateOdontologoRequest'),
        responses: { 201: created(ref('Odontologo')), ...ERR_AUTH, ...ERR_VALID }
      }
    },
    '/odontologos/{id}/mutuales': {
      parameters: [idPath('id', 'ID del odontólogo')],
      get: {
        tags: ['Odontólogos'],
        summary: 'Listar mutuales asociadas al odontólogo',
        description: 'Roles: ODONTOLOGO (sólo las propias), ADMINISTRADOR',
        security: [SEG],
        responses: { 200: okLista(ref('OdontologoMutual')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      }
    },
    '/odontologos/{id}': {

      parameters: [idPath()],
      get: {
        tags: ['Odontólogos'],
        summary: 'Obtener odontólogo',
        description: ROLES_STAFF,
        security: [SEG],
        responses: { 200: ok(ref('Odontologo')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      },
      put: {
        tags: ['Odontólogos'],
        summary: 'Actualizar odontólogo',
        description: SOLO_ADMIN,
        security: [SEG],
        requestBody: jsonBody('UpdateOdontologoRequest'),
        responses: { 200: ok(ref('Odontologo')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      },
      delete: {
        tags: ['Odontólogos'],
        summary: 'Eliminar odontólogo',
        description: SOLO_ADMIN,
        security: [SEG],
        responses: { 204: noContent, ...ERR_AUTH, ...ERR_NOTFOUND }
      }
    },
    '/odontologos/{id}/mutuales/{mutualId}': {
      parameters: [idPath('id', 'ID del odontólogo'), idPath('mutualId', 'ID de la mutual')],
      post: {
        tags: ['Odontólogos'],
        summary: 'Vincular mutual al odontólogo',
        description: SOLO_ADMIN,
        security: [SEG],
        requestBody: jsonBody('AddMutualOdontologoRequest'),
        responses: { 201: created(ref('OdontologoMutual')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      },
      delete: {
        tags: ['Odontólogos'],
        summary: 'Desvincular mutual del odontólogo',
        description: SOLO_ADMIN,
        security: [SEG],
        responses: { 204: noContent, ...ERR_AUTH, ...ERR_NOTFOUND }
      }
    },

    // ─────────────────────────── MUTUALES ───────────────────────────
    '/mutuales': {
      get: {
        tags: ['Mutuales'],
        summary: 'Listar mutuales',
        description: 'Público: el registro de paciente lo necesita antes del login.',
        security: PUBLICO,
        responses: { 200: okLista(ref('Mutual')) }
      },
      post: {
        tags: ['Mutuales'],
        summary: 'Crear mutual',
        description: SOLO_ADMIN,
        security: [SEG],
        requestBody: jsonBody('CreateMutualRequest'),
        responses: { 201: created(ref('Mutual')), ...ERR_AUTH, ...ERR_VALID }
      }
    },
    '/mutuales/{id}': {
      parameters: [idPath()],
      get: {
        tags: ['Mutuales'],
        summary: 'Obtener mutual',
        security: PUBLICO,
        responses: { 200: ok(ref('Mutual')), ...ERR_VALID, ...ERR_NOTFOUND }
      },
      put: {
        tags: ['Mutuales'],
        summary: 'Actualizar mutual',
        description: SOLO_ADMIN,
        security: [SEG],
        requestBody: jsonBody('UpdateMutualRequest'),
        responses: { 200: ok(ref('Mutual')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      },
      delete: {
        tags: ['Mutuales'],
        summary: 'Eliminar mutual',
        description: SOLO_ADMIN + '. Falla con 409 si tiene pacientes u odontólogos asociados.',
        security: [SEG],
        responses: { 204: noContent, ...ERR_AUTH, ...ERR_NOTFOUND, 409: err('Tiene registros asociados') }
      }
    },

    // ─────────────────────────── PRÁCTICAS ───────────────────────────
    '/practicas': {
      get: {
        tags: ['Prácticas'],
        summary: 'Listar prácticas',
        security: PUBLICO,
        responses: { 200: okLista(ref('Practica')) }
      },
      post: {
        tags: ['Prácticas'],
        summary: 'Crear práctica',
                description: 'Roles: ADMINISTRADOR, ODONTOLOGO (para cargar prácticas especiales no incluidas en el catálogo). Validación de codigo y precio con zod.',
        security: [SEG],
        requestBody: jsonBody('CreatePracticaRequest'),
        responses: { 201: created(ref('Practica')), ...ERR_AUTH, ...ERR_VALID }
      }
    },
    '/practicas/{id}': {
      parameters: [idPath()],
      get: {
        tags: ['Prácticas'],
        summary: 'Obtener práctica',
        security: PUBLICO,
        responses: { 200: ok(ref('Practica')), ...ERR_VALID, ...ERR_NOTFOUND }
      },
      put: {
        tags: ['Prácticas'],
        summary: 'Actualizar práctica',
                       description: 'Roles: ADMINISTRADOR. Modifica el catálogo de prácticas.',
        security: [SEG],
        requestBody: jsonBody('UpdatePracticaRequest'),
        responses: { 200: ok(ref('Practica')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      },
      delete: {
        tags: ['Prácticas'],
        summary: 'Eliminar práctica',
              description: 'Roles: ADMINISTRADOR. Falla con 409 si la práctica está en uso.',
        security: [SEG],
        responses: { 204: noContent, ...ERR_AUTH, ...ERR_NOTFOUND, 409: err('Tiene registros asociados') }
      }
    },

    // ─────────────────────────── DIENTES ───────────────────────────
    '/dientes': {
      get: {
        tags: ['Dientes'],
        summary: 'Listar dientes',
        security: PUBLICO,
        responses: { 200: okLista(ref('Diente')) }
      },
      post: {
        tags: ['Dientes'],
        summary: 'Crear diente',
        description: SOLO_ADMIN,
        security: [SEG],
        requestBody: jsonBody('CreateDienteRequest'),
        responses: { 201: created(ref('Diente')), ...ERR_AUTH, ...ERR_VALID }
      }
    },
    '/dientes/{id}': {
      parameters: [idPath()],
      get: {
        tags: ['Dientes'],
        summary: 'Obtener diente',
        security: PUBLICO,
        responses: { 200: ok(ref('Diente')), ...ERR_VALID, ...ERR_NOTFOUND }
      },
      put: {
        tags: ['Dientes'],
        summary: 'Actualizar diente',
        description: SOLO_ADMIN,
        security: [SEG],
        requestBody: jsonBody('UpdateDienteRequest'),
        responses: { 200: ok(ref('Diente')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      },
      delete: {
        tags: ['Dientes'],
        summary: 'Eliminar diente',
        description: SOLO_ADMIN,
        security: [SEG],
        responses: { 204: noContent, ...ERR_AUTH, ...ERR_NOTFOUND, 409: err('Tiene registros asociados') }
      }
    },

    // ─────────────────────────── CARAS ───────────────────────────
    '/caras': {
      get: {
        tags: ['Caras'],
        summary: 'Listar caras',
        security: PUBLICO,
        responses: { 200: okLista(ref('Cara')) }
      },
      post: {
        tags: ['Caras'],
        summary: 'Crear cara',
        description: SOLO_ADMIN,
        security: [SEG],
        requestBody: jsonBody('CreateCaraRequest'),
        responses: { 201: created(ref('Cara')), ...ERR_AUTH, ...ERR_VALID }
      }
    },
    '/caras/{id}': {
      parameters: [idPath()],
      get: {
        tags: ['Caras'],
        summary: 'Obtener cara',
        security: PUBLICO,
        responses: { 200: ok(ref('Cara')), ...ERR_VALID, ...ERR_NOTFOUND }
      },
      put: {
        tags: ['Caras'],
        summary: 'Actualizar cara',
        description: SOLO_ADMIN,
        security: [SEG],
        requestBody: jsonBody('UpdateCaraRequest'),
        responses: { 200: ok(ref('Cara')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      },
      delete: {
        tags: ['Caras'],
        summary: 'Eliminar cara',
        description: SOLO_ADMIN,
        security: [SEG],
        responses: { 204: noContent, ...ERR_AUTH, ...ERR_NOTFOUND, 409: err('Tiene dientes asociados') }
      }
    },
    '/caras/diente/{dienteId}': {
      parameters: [idPath('dienteId', 'ID del diente')],
      get: {
        tags: ['Caras'],
        summary: 'Caras vinculadas a un diente',
        description: 'Roles: cualquier usuario autenticado',
        security: [SEG],
        responses: { 200: okLista(ref('Cara')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      }
    },
    '/caras/diente/{dienteId}/{caraId}': {
      parameters: [idPath('dienteId', 'ID del diente'), idPath('caraId', 'ID de la cara')],
      post: {
        tags: ['Caras'],
        summary: 'Vincular cara a diente',
        description: SOLO_ADMIN + '. Si ya está vinculada devuelve 409.',
        security: [SEG],
        responses: { 201: created({ type: 'object' }), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND, 409: err('Ya vinculada') }
      },
      delete: {
        tags: ['Caras'],
        summary: 'Desvincular cara de diente',
        description: SOLO_ADMIN,
        security: [SEG],
        responses: { 204: noContent, ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      }
    },

    // ─────────────────────────── TURNOS ───────────────────────────
    '/turnos/disponibles': {
      get: {
        tags: ['Turnos'],
        summary: 'Turnos libres',
        description:
          'Público: el paciente lo consulta antes de reservar. Devuelve sólo turnos futuros en estado libre. ' +
          'La fecha se interpreta en hora de Argentina (día completo).',
        security: PUBLICO,
        parameters: [
          { name: 'odontologoId', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'fecha', in: 'query', required: false, schema: { type: 'string', format: 'date', example: '2026-10-20' } }
        ],
        responses: { 200: okLista(ref('TurnoDisponible')), ...ERR_VALID }
      }
    },
    '/turnos': {
      get: {
        tags: ['Turnos'],
        summary: 'Listar turnos (agenda)',
        description: ROLES_STAFF + '. El odontólogo sólo ve su propia agenda.',
        security: [SEG],
        parameters: [
          { name: 'odontologoId', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'estado', in: 'query', required: false, schema: ref('EstadoTurno') }
        ],
        responses: { 200: okLista(ref('Turno')), ...ERR_AUTH, ...ERR_VALID }
      },
      post: {
        tags: ['Turnos'],
        summary: 'Crear turno libre',
        description: 'Roles: ODONTOLOGO (sólo turnos propios), ADMINISTRADOR. Rechaza turnos en el pasado y superposiciones para el mismo odontólogo.',
        security: [SEG],
        requestBody: jsonBody('CreateTurnoRequest'),
        responses: { 201: created(ref('Turno')), ...ERR_AUTH, ...ERR_VALID, 404: err('Odontólogo no encontrado'), 409: err('Se superpone con otro turno') }
      }
    },
    '/turnos/{codigo}': {
      parameters: [idPath('codigo', 'Código del turno')],
      get: {
        tags: ['Turnos'],
        summary: 'Obtener turno',
        description: ROLES_STAFF,
        security: [SEG],
        responses: { 200: ok(ref('Turno')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      },
      put: {
        tags: ['Turnos'],
        summary: 'Modificar turno',
        description: SOLO_ADMIN + '. No se puede modificar un turno con reserva asociada.',
        security: [SEG],
        requestBody: jsonBody('UpdateTurnoRequest'),
        responses: { 200: ok(ref('Turno')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND, 409: err('Tiene reserva o se superpone') }
      },
      delete: {
        tags: ['Turnos'],
        summary: 'Eliminar turno',
        description: 'Roles: ODONTOLOGO (sólo turnos propios), ADMINISTRADOR. No se puede eliminar un turno con reserva asociada.',
        security: [SEG],
        responses: { 204: noContent, ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND, 409: err('Tiene reserva asociada') }
      }
    },

    // ─────────────────────────── RESERVAS ───────────────────────────
    '/reservas': {
      get: {
        tags: ['Reservas'],
        summary: 'Listar reservas',
        description:
          'Roles: PACIENTE (sólo ve las propias), ODONTOLOGO, ADMINISTRADOR',
        security: [SEG],
        parameters: [
          { name: 'pacienteId', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'odontologoId', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'estado', in: 'query', required: false, schema: ref('EstadoReserva') }
        ],
        responses: { 200: okLista(ref('Reserva')), ...ERR_AUTH, ...ERR_VALID }
      },
      post: {
        tags: ['Reservas'],
        summary: 'Reservar un turno (CUU 1)',
        description: 'Roles: PACIENTE (sólo para sí mismo), ADMINISTRADOR. El turno pasa a ocupado.',
        security: [SEG],
        requestBody: jsonBody('CreateReservaRequest'),
        responses: {
          201: created(ref('Reserva')),
          ...ERR_AUTH,
          ...ERR_VALID,
          ...ERR_NOTFOUND,
          409: err('El turno ya fue reservado')
        }
      }
    },
    '/reservas/{id}': {
      parameters: [idPath()],
      get: {
        tags: ['Reservas'],
        summary: 'Obtener reserva',
        description: 'Roles: ODONTOLOGO (sólo las propias), ADMINISTRADOR. El paciente consulta sus reservas con GET /reservas.',
        security: [SEG],
        responses: { 200: ok(ref('Reserva')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      }
    },
    '/reservas/{id}/cancelar': {
      parameters: [idPath()],
      put: {
        tags: ['Reservas'],
        summary: 'Cancelar reserva',
        description:
          'Roles: PACIENTE (sólo las propias), ODONTOLOGO (sólo las propias), ADMINISTRADOR. ' +
          'Libera el turno. Sólo se puede cancelar una reserva confirmada.',
        security: [SEG],
        requestBody: { required: false, content: { 'application/json': { schema: ref('CancelarReservaRequest') } } },
        responses: { 200: ok(ref('Reserva')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND, 409: err('Estado no cancelable') }
      }
    },
    '/reservas/{id}/finalizar': {
      parameters: [idPath()],
      put: {
        tags: ['Reservas'],
        summary: 'Finalizar consulta',
        description: 'Roles: ODONTOLOGO (sólo las propias), ADMINISTRADOR. Sólo reservas confirmadas.',
        security: [SEG],
        requestBody: jsonBody('FinalizarReservaRequest'),
        responses: { 200: ok(ref('Reserva')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND, 409: err('Estado no finalizable') }
      }
    },

    // ─────────────────────────── DETALLES ───────────────────────────
    '/detalles': {
      get: {
        tags: ['Detalles'],
        summary: 'Listar prácticas realizadas',
        description: 'Roles: PACIENTE (sólo las de sus reservas), ODONTOLOGO, ADMINISTRADOR',
        security: [SEG],
        parameters: [
          { name: 'reservaId', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'odontogramaId', in: 'query', required: false, schema: { type: 'integer' } }
        ],
        responses: { 200: okLista(ref('Detalle')), ...ERR_AUTH, ...ERR_VALID }
      },
      post: {
        tags: ['Detalles'],
        summary: 'Registrar práctica realizada (CUU 2)',
        description: ROLES_STAFF,
        security: [SEG],
        requestBody: jsonBody('CreateDetalleRequest'),
        responses: { 201: created(ref('Detalle')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      }
    },
    '/detalles/{id}': {
      parameters: [idPath()],
      get: {
        tags: ['Detalles'],
        summary: 'Obtener práctica realizada',
        description: 'Roles: PACIENTE (un detalle ajeno responde 404), ODONTOLOGO, ADMINISTRADOR',
        security: [SEG],
        responses: { 200: ok(ref('Detalle')), ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      },
      delete: {
        tags: ['Detalles'],
        summary: 'Eliminar práctica realizada',
        description: SOLO_ADMIN,
        security: [SEG],
        responses: { 204: noContent, ...ERR_AUTH, ...ERR_VALID, ...ERR_NOTFOUND }
      }
    }
  }
} as const;

export default swaggerSpec;