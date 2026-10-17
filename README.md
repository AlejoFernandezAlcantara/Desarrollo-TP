# Consultorio Carestia - Sistema de gestión de turnos odontológicos

Aplicación web full stack para la gestión de un consultorio odontológico: pacientes, mutuales, odontólogos, turnos y reservas, atención de consultas con odontograma interactivo y registro de prácticas realizadas.

Trabajo práctico de **Desarrollo de Software**.

## Integrantes

| Legajo | Integrante |
|--------|------------|
| 54443 | Carestia, Juan Andrés |
| 52335 | Merad, Juan Segundo |
| 53784 | Fernandez, Alejo |
| 54429 | Gorandi Marmol, Jose Luis |

## Tecnologías

| Parte | Stack |
|-------|-------|
| **Frontend** | React 19, TypeScript, Vite, React Router, React Query, React Hook Form, Vitest |
| **Backend** | Node.js, Express 5, TypeScript, Prisma (ORM), Zod (validación), JWT, Helmet, Swagger |
| **Base de datos** | MySQL 8 (en Docker) |

Frontend y backend son independientes y se comunican por una API REST.

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop) instalado y **abierto** (que diga "Running").
- [Node.js](https://nodejs.org) **22 LTS** (mínimo 22.12 o 20.19) con npm.
- Puertos libres: `3001` (backend), `5173` (frontend) y `3307` (base de datos).

## Instalación y ejecución (recomendado)

Un solo script levanta la base de datos, instala las dependencias, carga los datos iniciales y arranca el backend y el frontend. Si faltan los archivos `.env`, los crea con valores de desarrollo.

Clonar el repositorio y, desde la carpeta raíz (`Desarrollo-TP`), ejecutar **en la rama `master`**:

**Windows (PowerShell)**

```powershell
.\iniciar.bat
```

**Mac / Linux**

```bash
chmod +x iniciar.sh detener.sh   # solo la primera vez
./iniciar.sh
```

La primera vez puede tardar 1 o 2 minutos mientras MySQL carga el esquema. Cuando termina, abrir **http://localhost:5173**.

Para apagar todo:

```powershell
.\detener.bat        # Windows
./detener.sh         # Mac / Linux
```

Para borrar la base de datos y crearla de cero (pide confirmación):

```powershell
.\iniciar.bat reiniciar     # Windows
./iniciar.sh --reiniciar    # Mac / Linux
```

## Direcciones

| Servicio | URL |
|----------|-----|
| Aplicación (frontend) | http://localhost:5173 |
| API (backend) | http://localhost:3001/api |
| Documentación de la API (Swagger) | http://localhost:3001/api/docs |
| Base de datos MySQL | `localhost:3307` (usuario `root`, contraseña `admin`, base `consultorioBdd`) |

## Usuarios de prueba

Se crean automáticamente al iniciar. Hay tres niveles de acceso:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | `admin@consultorio.com` | `Admin123!` |
| Odontólogo | `odonto@consultorio.com` | `Odonto123!` |
| Paciente | `paciente@consultorio.com` | `Paciente123!` |

También se puede registrar un paciente nuevo desde la pantalla de registro.

## Ejecución manual (alternativa)

Si se prefiere no usar el script:

**1. Base de datos** (desde la raíz del repositorio)

```bash
docker compose up -d db
```

**2. Backend** (en `REACT-FULLSTACK/server`)

Copiar `.env-example` a `.env` y completar los valores (ver sección de variables de entorno). Después:

```bash
npm ci
npx prisma generate
npx tsx src/scripts/seed_auth.ts      # usuarios de prueba
npx tsx src/scripts/seed_dientes.ts   # piezas dentales y caras
npm run dev
```

**3. Frontend** (en `REACT-FULLSTACK/client`, en otra terminal)

Copiar `.env-example` a `.env`. Después:

```bash
npm ci
npm run dev
```

## Variables de entorno

Cada parte tiene su archivo `.env-example` con los nombres de las variables.

**Backend** (`REACT-FULLSTACK/server/.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión a MySQL | `mysql://root:admin@localhost:3307/consultorioBdd` |
| `PORT` | Puerto del servidor | `3001` |
| `NODE_ENV` | Ambiente (`development`, `production`, `testing`) | `development` |
| `JWT_SECRET` | Secreto para firmar los tokens (en producción, mínimo 32 caracteres) | |
| `JWT_EXPIRES_IN` | Duración del token | `7d` |
| `CLIENT_URL` / `ALLOWED_ORIGINS` | Origen(es) permitidos por CORS | `http://localhost:5173` |

**Frontend** (`REACT-FULLSTACK/client/.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_BASE` | URL base de la API | `http://localhost:3001/api` |

## Tests

**Frontend** (en `REACT-FULLSTACK/client`):

```bash
npm test
```

**Backend:** prueba de humo que recorre los flujos principales y verifica permisos por rol. Con el backend corriendo, desde `REACT-FULLSTACK/server`:

```bash
node src/scripts/smoke-test.mjs
```

## Estructura del proyecto

```
Desarrollo-TP/
├── iniciar.bat / iniciar.sh      Arranque de todo el sistema
├── detener.bat / detener.sh      Apagado
├── docker-compose.yml            Base de datos MySQL
├── database/                     Script de creación del esquema
└── REACT-FULLSTACK/
    ├── client/                   Frontend (React + Vite)
    │   └── src/
    │       ├── pages/            Pantallas: admin, agenda, auth, consultorio, recepcion
    │       ├── components/       Navbar, Modal, Toast, rutas protegidas
    │       ├── contexts/         Autenticación y tema (claro/oscuro)
    │       ├── services/         Cliente de la API
    │       └── types/            Modelos de datos (interfaces TypeScript)
    └── server/                   Backend (Express + Prisma)
        ├── prisma/               Esquema de la base de datos
        └── src/
            ├── routes/           Rutas de la API
            ├── controllers/      Controladores
            ├── services/         Lógica de negocio y acceso a datos
            ├── middlewares/      Autenticación, roles, validación, errores
            └── docs/             Especificación Swagger
```

## Solución de problemas

| Problema | Qué hacer |
|----------|-----------|
| "Docker no está corriendo" | Abrir Docker Desktop, esperar a que diga "Running" y volver a ejecutar el script. |
| "El puerto ya está en uso" | Ejecutar el script de detener, o cerrar la aplicación que usa ese puerto. |
| El backend no responde | Revisar `logs/backend.log`. |
| El frontend no responde | Revisar `logs/frontend.log`. |
| La base no termina de cargar | Revisar con `docker compose logs db`. |
| Quiero empezar con la base vacía | Usar la opción de reiniciar (ver arriba). |

Ver la base desde la consola:

```bash
docker compose exec db mysql -uroot -padmin consultorioBdd
```
