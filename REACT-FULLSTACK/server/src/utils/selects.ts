/**
 * Campos de Usuario que se pueden exponer por la API.
 * Evita devolver password_hash cuando se hace `include: { usuario: true }`.
 */
export const usuarioPublico = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  activo: true
} as const;
