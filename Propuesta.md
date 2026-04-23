Propuesta TP DSW

## Grupo
### Integrantes
* 54443 - Carestia, Juan Andrés
* 52335 - Merad , Juan Segundo
* 53784 - Fernandez , Alejo
* 54429 - Gorandi Marmol, Jose Luis
  

### Repositorios
  https://github.com/AlejoFernandezAlcantara/Desarrollo-TP



## Tema
### Descripción
Sistema de gestión de turnos en un consultorio odontologico que se centraliza en  el manejo de pacientes, consultas y especialidades en una interfaz simple e intuitiva. Buscando agilizar cada etapa del servicio, desde que el paciente solicita el turno hasta que se realiza la atencion, mejorando tanto el manejo interno del consultorio como la experiencia del paciente.

### Modelo
https://app.diagrams.net/#G1z93UDN1OUiycHQpA3MJCTfX8HWOygKV8#%7B%22pageId%22%3A%22lv6PCzvnAAI5jWWzNXJ_%22%7D


## Alcance Funcional 

### Alcance Mínimo

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Practica<br>2. CRUD Paciente<br>3. CRUD Odontologo<br>4. CRUD Turno|
|CRUD dependiente|1. CRUD Precio {depende de} CRUD  Practica<br>2. CRUD Consulta {depende de} CRUD Paciente y CRUD Odontologo<br>3. CRUD Reserva {depende de} CRUD Consuta|
|Listado<br>+<br>detalle| 1. Listado de odontologos filtrado por obra social, muestra nombre del odontologo y sus especialidades => detalle  muestra datos completos del odontologo <br> 2. Listado de turnos filtrado por rango de fecha, muestra codigo turno, fecha turno, estado del turno y nombre del paciente => detalle muestra datos completos del paciente, odontologo y practicas realizadas|
|CUU/Epic|1. Reservar un turno con un Odontolo <br>2. Enviar recordatorio de turno al Paciente <br>3. Cancelacion de reserva|


Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD Practica<br>2. CRUD Paciente<br>3. CRUD Odontologo<br>4. CRUD Turno<br>5. CRUD precio<br>6. CRUD Reserva<br>7. CRUD Mutual<br>8. CRUD Diente <br>9. CRUD Cara <br>10. CRUD Consulta |
|CUU/Epic|1. Reservar un turno con un Odontolo<br>2. Enviar recordatorio de turno al paciente<br>3. Cancelacion de turno<br>4. Calcular cobro de la atencion al paciente<br>5. Actualizar el precio de las practica<br>6. Cambio de turno|


### Alcance Adicional Voluntario

*Nota*: El Alcance Adicional Voluntario es opcional, pero ayuda a que la funcionalidad del sistema esté completa y será considerado en la nota en función de su complejidad y esfuerzo.

|Req|Detalle|
|:-|:-|
|Listados |1. Historial del Paciente muestra turnos atendidos, fecha turno y practicas realizadas <br>2. Reservas filtradas por estado muestra fecha reserva y datos del paciente|
|CUU/Epic|1. Realizar facturacion del cobro al paciente<br>2. Cancelación de reserva|
|Otros|1. Solicitud de cambio de turno|


