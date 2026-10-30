# Tracking de Features, Bugs e Issues

Seguimiento del estado de desarrollo de las funcionalidades, correcciones de errores y tareas del proyecto.

---

## 1. Módulos y Funcionalidades (Features)

| Módulo / Feature | Alcance | Estado | Observaciones |
| :--- | :---: | :---: | :--- |
| **Autenticación con JWT** | Regularidad | ✅ Completado | Login, logout, cookie `HttpOnly`, middleware `authenticateToken`. |
| **Control de Acceso por Roles (RBAC)** | Regularidad | ✅ Completado | Roles `ADMINISTRADOR`, `ODONTOLOGO`, `PACIENTE`. |
| **CRUD Prácticas Odontológicas** | Regularidad | ✅ Completado | Alta, baja, modificación y listado con precios. |
| **CRUD Mutuales (Obras Sociales)** | Regularidad | ✅ Completado | Gestión administrativa de mutuales. |
| **CRUD Odontólogos** | Regularidad | ✅ Completado | Gestión con matrícula, especialidad y vinculación a mutuales. |
| **CRUD Pacientes** | Regularidad | ✅ Completado | Ficha de paciente, datos personales y afiliación a obras sociales. |
| **Datos Maestros: Dientes y Caras** | Regularidad | ✅ Completado | Numeración FDI precargada vía seed y expuesta por API REST. |
| **Agenda de Turnos** | Regularidad | ✅ Completado | Generación de turnos por odontólogo y consulta de disponibilidad. |
| **Reserva de Turnos (Paciente)** | Regularidad | ✅ Completado | Selección de profesional, día/horario y confirmación de reserva. |
| **Atención de Consultas (Odontograma)** | Regularidad | ✅ Completado | Interfaz visual interactiva para marcar caras tratadas y registrar prácticas. |
| **Gestión de Perfil de Usuario** | Regularidad | ✅ Completado | Consulta y actualización de datos personales y cambio de contraseña. |
| **Tema Claro / Oscuro** | Opcional | ✅ Completado | `ThemeContext` con persistencia en localStorage. |
| **Liquidación y Facturación** | Aprobación | ⏳ Planificado | Módulo avanzado de cobro y liquidación de coseguros. |

---

## 2. Requerimientos Técnicos y de Seguridad

| Ítem Técnico | Estado | Implementación |
| :--- | :---: | :--- |
| **Validación de Datos (Runtime)** | ✅ Completado | Esquemas Zod en `server/src/utils/validators.ts` y middleware `validateRequest`. |
| **Manejo Centralizado de Errores** | ✅ Completado | `AppError`, `errorHandler` y wrapper `asyncHandler` en Express. |
| **Headers de Seguridad (Helmet)** | ✅ Completado | Middleware `helmet()` protegiendo encabezados HTTP. |
| **Rate Limiting** | ✅ Completado | `apiLimiter` general y `authLimiter` estricto contra ataques de fuerza bruta. |
| **Persistencia ORM** | ✅ Completado | Prisma ORM mapeando a MySQL con migraciones/schema relacional. |
| **Dockerización** | ✅ Completado | `docker-compose.yml` para levantar MySQL localmente. |
| **Scripts de Automatización** | ✅ Completado | `iniciar.bat` / `iniciar.sh` para arranque con un solo comando. |
| **Documentación de la API** | ✅ Completado | Swagger UI interactivo disponible en `/api/docs`. |

---

## 3. Bugs Identificados y Resueltos

| ID | Descripción del Problema | Causa Raíz | Solución Aplicada | Estado |
| :---: | :--- | :--- | :--- | :---: |
| **BUG-01** | Desfasaje horario de turnos en el navegador | El backend almacena en UTC y el navegador tomaba la zona local. | Se creó `client/src/utils/fecha.ts` forzando la zona horaria `America/Argentina/Buenos_Aires`. | ✅ Resuelto |
| **BUG-02** | Pérdida de sesión al recargar la página (F5) | Estado de React volátil en memoria. | Se implementó llamada a `/api/auth/me` al montar `AuthProvider` (`checkSession`). | ✅ Resuelto |
| **BUG-03** | Rutas directas daban 404 en Vercel | Vercel intentaba resolver archivos físicos para rutas de React Router. | Se configuró regla rewrite en `vercel.json` dirigiendo todo a `/index.html`. | ✅ Resuelto |
| **BUG-04** | Bloqueo de cookies en peticiones Cross-Origin | Navegador rechazaba cookies de terceros entre Vercel y Render. | Configuración de CORS con `credentials: true` y `SameSite: None; Secure` en producción. | ✅ Resuelto |

