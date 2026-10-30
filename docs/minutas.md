# Minutas de Reunión y Avance

Registro de las reuniones periódicas de coordinación, diseño e integración del equipo de desarrollo.

---

### Minuta 1: Definición de Alcance y Modelo de Datos
* **Fecha:** 15 de Abril de 2026
* **Participantes:** Carestia Juan, Merad Juan, Fernandez Alejo, Gorandi Jose Luis.
* **Objetivos y Temas tratados:**
  - Análisis del dominio: clínica odontológica y gestión de turnos.
  - Diseño preliminar del diagrama Entidad-Relación y definición de tablas (Usuarios, Pacientes, Odontólogos, Turnos, Reservas, Mutuales, Dientes y Caras).
  - Elección del stack tecnológico: Node.js + Express con Prisma ORM en Backend y React + TypeScript con Vite en Frontend.
* **Acuerdos y Próximos pasos:**
  - Redacción de la propuesta inicial (`Propuesta.md`).
  - Creación del repositorio en GitHub e inicialización de branches.

---

### Minuta 2: Arquitectura del Backend, Prisma y Autenticación
* **Fecha:** 28 de Mayo de 2026
* **Participantes:** Carestia Juan, Merad Juan, Fernandez Alejo, Gorandi Jose Luis.
* **Objetivos y Temas tratados:**
  - Definición de capas del backend: Rutas (`routes`), Controladores (`controllers`), Servicios (`services`) y Middlewares (`middlewares`).
  - Implementación de seguridad con JWT emitido en cookies `HttpOnly` y middleware `authenticateToken`.
  - Roles del sistema: `ADMINISTRADOR`, `ODONTOLOGO` y `PACIENTE`.
  - Validación de esquemas en runtime con Zod y middlewares de rate limiting.
* **Acuerdos y Próximos pasos:**
  - Carga de datos iniciales mediante scripts de seeding (`seed_auth.ts`, `seed_dientes.ts`).
  - Configuración del contenedor Docker para MySQL.

---

### Minuta 3: Desarrollo de Vistas Frontend y Odontograma
* **Fecha:** 10 de Agosto de 2026
* **Participantes:** Carestia Juan, Merad Juan, Fernandez Alejo, Gorandi Jose Luis.
* **Objetivos y Temas tratados:**
  - Estructuración de rutas en React Router y componente `<ProtectedRoute>` con control por roles.
  - Implementación de `AuthContext` para el estado global de la sesión.
  - Diseño del componente interactivo de Odontograma dental para atención de consultas.
  - Conexión de servicios con `fetch` y propagación de credenciales (`credentials: 'include'`).
* **Acuerdos y Próximos pasos:**
  - Refinar manejo de fechas en huso horario de Argentina (`America/Argentina/Buenos_Aires`).
  - Implementar alertas con Toast y modales de confirmación.

---

### Minuta 4: Despliegue en la Nube, Documentación y Cierre de Regularidad
* **Fecha:** 20 de Octubre de 2026
* **Participantes:** Carestia Juan, Merad Juan, Fernandez Alejo, Gorandi Jose Luis.
* **Objetivos y Temas tratados:**
  - Deploy continuo del Frontend en Vercel con reglas de reescritura en `vercel.json`.
  - Deploy del Backend en Render y configuración de CORS / variables de entorno de producción.
  - Verificación de especificación OpenAPI en Swagger (`/api/docs`).
  - Preparación de scripts automatizados de ejecución (`iniciar.bat` e `iniciar.sh`).
* **Acuerdos y Próximos pasos:**
  - Validación final del cumplimiento de requerimientos de Regularidad.
  - Consolidación de la carpeta de documentación `docs/`.

