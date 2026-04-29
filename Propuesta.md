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
Sistema de gestión de turnos de un consultorio odontológico centralizado en el manejo de pacientes y reservas en una interfaz simple e intuitiva. Abarca cada etapa del servicio, desde que el paciente realiza la reserva hasta que se realiza la consulta.

### Modelo
https://app.diagrams.net/#G1z93UDN1OUiycHQpA3MJCTfX8HWOygKV8#%7B%22pageId%22%3A%22lv6PCzvnAAI5jWWzNXJ_%22%7D


## Alcance Funcional 

### Alcance Mínimo

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Practica<br>2. CRUD Mutual<br>3. CRUD Odontologo<br>4. CRUD Diente|
|CRUD dependiente|1. CRUD paciente {depende de} CRUD Mutual<br>2. CRUD Cara {depende de} CRUD Diente|
|Listado<br>+<br>detalle| 1. Listado de odontologos filtrado por obra social, muestra nombre del odontologo y sus especialidades => detalle  muestra datos completos del odontologo<br>2. Listado de los próximos turnos disponibles por odontólogo => Detalle: muestra Fecha y hora y duración.|
|CUU/Epic|1. Reservar un turno con un Odontolo<br>2. Registrar practicas realizadas en una consulta |


Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD Practica<br>2. CRUD Paciente<br>3. CRUD Odontologo<br>4. CRUD Turno<br>5. CRUD Reserva<br>6. CRUD Mutual<br>7. CRUD Diente <br>8. CRUD Cara <br>9. CRUD Consulta |
|Listado<br>+<br>detalle|<br>1. Listado de Mutuales disponibles => Detalle: Muestra nombres de las mutuales con sus respectivos planes<br>2. Listado de reservas => Detalle: Se le muestra al paciente todas las reservas que tiene, con su respectiva fecha de creacion,su estado, fecha y hora de consulta, nombre y apellido del odontologo, nombre y apellido del paciente y cualquier observacion pertinente<br>3. Listado de practicas realizadas en una consulta => detalle: Al terminar la consulta se guardan todas las practicas realizadas, quedando disponibles el codigo, el valor y el detalle de cada una, asi como el subtotal de la consulta ya calculado |
|CUU/Epic|1. Calcular cobro de la atencion al paciente<br>2. Actualizar el precio de las practica<br>3. Realizar facturacion del cobro al paciente |


### Alcance Adicional Voluntario

*Nota*: El Alcance Adicional Voluntario es opcional, pero ayuda a que la funcionalidad del sistema esté completa y será considerado en la nota en función de su complejidad y esfuerzo.

|Req|Detalle|
|:-|:-|
|Listados |1. Historial del Paciente muestra turnos atendidos, fecha turno y practicas realizadas <br>2. Listado de consultas de un odontologo filtrado por rango de fecha, muestra codigo turno, fecha turno, estado del turno y nombre del paciente => detalle muestra datos completos del paciente, odontologo y practicas realizadas|
|CUU/Epic|1. Cambio de Mutual<br>2. Cambio de turno|
|Otros|1. Enviar recordatorio de turno al paciente|





