Propuesta TP DSW

## Grupo
### Integrantes
* 54443 - Carestia, Juan Andrés
* 52335 - Merad, Juan Segundo
* 53784 - Fernandez, Alejo
* 54429 - Gorandi Marmol, Jose Luis

### Repositorios
https://github.com/AlejoFernandezAlcantara/Desarrollo-TP

* Rama `master`: código de la aplicación (frontend, backend y scripts de ejecución).
* Rama `main`: esta propuesta.

## Tema
### Descripción
Sistema de gestión de turnos de un consultorio odontológico centralizado en el manejo de pacientes y reservas en una interfaz simple e intuitiva. Abarca cada etapa del servicio, desde que el paciente realiza la reserva hasta que se realiza la consulta.

### Modelo
https://app.diagrams.net/#G1z93UDN1OUiycHQpA3MJCTfX8HWOygKV8#%7B%22pageId%22%3A%22lv6PCzvnAAI5jWWzNXJ_%22%7D

## Tecnologías y despliegue

### Tecnologías utilizadas
|Parte|Tecnología|
|:-|:-|
|Frontend|React, TypeScript, Vite, React Router, React Query, React Hook Form. Tests con Vitest|
|Backend|Node.js, Express, TypeScript, Prisma (ORM), Zod (validación), JWT (autenticación), Swagger (documentación de la API)|
|Base de datos|MySQL (persistente, accedida a través de Prisma)|

Frontend y backend son independientes y se comunican mediante una API REST.

### Tecnologías distintas a las vistas en el cursado
Se informan para su aprobación por parte de los docentes:

* **TypeScript en lugar de JavaScript.** Es un superconjunto de JavaScript que se compila a JavaScript y se ejecuta sobre el mismo runtime (Node.js), con el mismo modelo asíncrono (event loop y promesas). Agrega tipado estático, que permite detectar errores de contrato entre el frontend y el backend en tiempo de compilación.
* **React en lugar de Angular.** Se eligió por motivos de aprendizaje. Cumple los requisitos del frontend: componentes con propiedades de entrada (props) y de salida (callbacks), reactividad ante el estado, servicios para consumir la API y modelos de datos tipados.

### Despliegue
|Parte|Servicio|Enlace|
|:-|:-|:-|
|Frontend|Vercel|https://consultorio-carestia-1.vercel.app/|
|Backend (API)|Render|https://consultorio-backend-v0ar.onrender.com/api|
|Base de datos|MySQL|Accedida por el backend mediante Prisma|

Instrucciones para instalar y ejecutar el proyecto: [README.md](https://github.com/AlejoFernandezAlcantara/Desarrollo-TP/blob/master/README.md) (rama `master`).

## Datos maestros precargados: Diente y Cara
Las piezas dentales (numeración FDI), sus caras y la relación Diente-Cara son datos fijos, que no cambian durante la operación del consultorio. Por eso se cargan automáticamente mediante un script de carga inicial (`seed_dientes.ts`, ejecutado por los scripts `iniciar.bat` e `iniciar.sh`) y no se gestionan desde una pantalla de la aplicación.

* El backend expone igualmente los endpoints REST completos de Diente y Cara (alta, consulta, modificación y baja), restringidos al rol ADMINISTRADOR y documentados en Swagger.
* El frontend consume estos datos en el odontograma interactivo, donde se seleccionan las piezas para registrar prácticas.
* Este criterio se informa a los docentes para su conformidad.

## Alcance Funcional

### Alcance Mínimo

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Práctica<br>2. CRUD Mutual<br>3. CRUD Odontólogo<br>4. CRUD Diente (datos precargados, ver sección anterior)|
|CRUD dependiente|1. CRUD Paciente {depende de} CRUD Mutual<br>2. CRUD Cara {depende de} CRUD Diente (datos precargados, ver sección anterior)|
|Listado<br>+<br>detalle| 1. Listado de odontólogos filtrado por obra social, muestra nombre del odontólogo y sus especialidades => detalle muestra datos completos del odontólogo<br>2. Listado de los próximos turnos disponibles por odontólogo => Detalle: muestra Fecha y hora y duración.|
|CUU/Epic|1. Reservar un turno con un Odontólogo<br>2. Registrar prácticas realizadas en una consulta |


Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD Práctica<br>2. CRUD Paciente<br>3. CRUD Odontólogo<br>4. CRUD Turno<br>5. CRUD Reserva<br>6. CRUD Mutual<br>7. CRUD Diente (datos precargados)<br>8. CRUD Cara (datos precargados)<br>9. CRUD Consulta |
|Listado<br>+<br>detalle|<br>1. Listado de Mutuales disponibles => Detalle: Muestra nombres de las mutuales con sus respectivos planes<br>2. Listado de reservas => Detalle: Se le muestra al paciente todas las reservas que tiene, con su respectiva fecha de creación, su estado, fecha y hora de consulta, nombre y apellido del odontólogo, nombre y apellido del paciente y cualquier observación pertinente<br>3. Listado de prácticas realizadas en una consulta => detalle: Al terminar la consulta se guardan todas las prácticas realizadas, quedando disponibles el código, el valor y el detalle de cada una, así como el subtotal de la consulta ya calculado |
|CUU/Epic|1. Calcular cobro de la atención al paciente<br>2. Actualizar el precio de las prácticas<br>3. Realizar facturación del cobro al paciente |


### Alcance Adicional Voluntario

*Nota*: El Alcance Adicional Voluntario es opcional, pero ayuda a que la funcionalidad del sistema esté completa y será considerado en la nota en función de su complejidad y esfuerzo.

|Req|Detalle|
|:-|:-|
|Listados |1. Historial del Paciente muestra turnos atendidos, fecha turno y prácticas realizadas <br>2. Listado de consultas de un odontólogo filtrado por rango de fecha, muestra código turno, fecha turno, estado del turno y nombre del paciente => detalle muestra datos completos del paciente, odontólogo y prácticas realizadas|
|CUU/Epic|1. Cambio de Mutual<br>2. Cambio de turno|
|Otros|1. Enviar recordatorio de turno al paciente|

## Entregas

### Regularidad

* **Instrucciones de instalación y ejecución:** [README.md](https://github.com/AlejoFernandezAlcantara/Desarrollo-TP/blob/master/README.md) en la rama `master`.
* **Aplicación desplegada:** https://consultorio-carestia-1.vercel.app/
* **Pull requests:**
  * [#2 - Responsive mobile-first (frontend)](https://github.com/AlejoFernandezAlcantara/Desarrollo-TP/pull/2)
  * [#3 - README con instrucciones de instalación y ejecución](https://github.com/AlejoFernandezAlcantara/Desarrollo-TP/pull/3)

