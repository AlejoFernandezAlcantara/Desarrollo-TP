# Propuesta TP DSW - Consultorio Odontológico Carestia

## Grupo
### Integrantes
* 54443 - Carestia, Juan Andrés
* 52335 - Merad, Juan Segundo
* 53784 - Fernandez, Alejo
* 54429 - Gorandi Marmol, Jose Luis

### Repositorio
* **URL:** https://github.com/AlejoFernandezAlcantara/Desarrollo-TP
* **Rama `master`:** Código fuente de la aplicación (Frontend, Backend, BDD y scripts de ejecución).
* **Rama `main`:** Versión inicial del repositorio.

---

## Tema
### Descripción
Sistema de gestión integral para consultorio odontológico, centralizado en el manejo de pacientes, obras sociales (mutuales), odontólogos, turnos y reservas en una interfaz simple e intuitiva. Abarca cada etapa del servicio: desde la reserva del turno por parte del paciente hasta la atención odontológica con registro de prácticas e historia clínica interactiva (odontograma).

### Diagrama de Dominio
El modelo entidad-relación y de dominio se encuentra diseñado en:
* [Diagrama de Dominio (diagrams.net)](https://app.diagrams.net/#G1z93UDN1OUiycHQpA3MJCTfX8HWOygKV8#%7B%22pageId%22%3A%22lv6PCzvnAAI5jWWzNXJ_%22%7D)

---

## Tecnologías y Despliegue

### Tecnologías utilizadas
| Parte | Tecnología |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, React Router, React Query, React Hook Form, Vitest |
| **Backend** | Node.js, Express 5, TypeScript, Prisma (ORM), Zod (validación), JWT (autenticación en cookie HttpOnly), Helmet, express-rate-limit, Swagger |
| **Base de datos** | MySQL 8 (persistente, dockerizada para desarrollo local) |

Frontend y backend son independientes y se comunican mediante una API REST.

### Justificación de tecnologías
* **TypeScript en lugar de JavaScript:** Superconjunto que aporta tipado estático tanto en el cliente como en el servidor, garantizando contratos de datos sólidos y evitando errores en tiempo de ejecución.
* **React:** Cumple holgadamente con los requerimientos del frontend (arquitectura basada en componentes, propiedades de entrada y salida, reactividad con Hooks, consumo de API por servicios y modelos tipados).

### Despliegue
| Componente | Servicio | URL |
| :--- | :--- | :--- |
| **Frontend** | Vercel | https://consultorio-carestia-1.vercel.app/ |
| **Backend (API)** | Render | https://consultorio-backend-v0ar.onrender.com/api |
| **Documentación API** | Swagger UI | https://consultorio-backend-v0ar.onrender.com/api/docs |
| **Base de Datos** | MySQL | Conexión remota gestionada con Prisma |

---

## Datos maestros precargados: Diente y Cara
Las piezas dentales (nomenclatura FDI), sus caras y la relación Diente-Cara son datos fijos que no varían durante la operativa del consultorio. Se cargan de manera automatizada mediante el script de seed (`seed_dientes.ts`) al inicializar la base de datos:
* El backend expone igualmente sus endpoints REST completos (`/api/dientes`, `/api/caras`), asegurados para el rol `ADMINISTRADOR` y documentados en Swagger.
* El frontend consume estos datos directamente en el odontograma interactivo para marcar tratamientos sobre las caras de cada pieza.

---

## Alcance Funcional

### Alcance para Regularidad
| Tipo de Requerimiento | Detalle |
| :--- | :--- |
| **CRUD Simple** | 1. CRUD Práctica<br>2. CRUD Mutual<br>3. CRUD Odontólogo<br>4. CRUD Diente (datos precargados) |
| **CRUD Dependiente** | 1. CRUD Paciente (asociado a Mutual)<br>2. CRUD Cara (asociado a Diente) |
| **Listado + Detalle** | 1. Listado de odontólogos filtrado por obra social -> Detalle con datos completos.<br>2. Listado de próximos turnos disponibles por odontólogo -> Detalle con fecha, hora y duración. |
| **Casos de Uso / Epics** | 1. Reservar un turno con un odontólogo.<br>2. Registrar prácticas realizadas en una consulta (atención con odontograma interactivo). |

### Alcance para Aprobación Directa
| Tipo de Requerimiento | Detalle |
| :--- | :--- |
| **CRUDs Adicionales** | CRUD Turnos, CRUD Reservas, CRUD Consultas/Detalles. |
| **Listados + Detalle** | Listado de mutuales con planes; Listado de reservas del paciente con estados y observaciones; Listado de prácticas realizadas con cálculo de coseguro y subtotales. |
| **Casos de Uso Complejos** | Cálculo de cobro / liquidación según cobertura de mutual; actualización de aranceles; facturación. |

