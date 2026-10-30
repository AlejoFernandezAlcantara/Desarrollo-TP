import prisma from '../lib/prisma';

// Datos de ejemplo para ver el odontograma con prácticas por cara.
// Usa la paciente y el odontólogo de seed_auth.ts y las piezas/caras de seed_dientes.ts,
// así que se ejecuta después de esos dos. Si los ejemplos ya están cargados no hace nada.

const MARCA = '[Ejemplo]'; // prefijo de las observaciones de las reservas de ejemplo

const PRACTICAS = [
  { codigo: 'EJ-01', detalle: 'Obturación con resina', precio: 15000 },
  { codigo: 'EJ-02', detalle: 'Sellador de fosas y fisuras', precio: 8000 },
  { codigo: 'EJ-03', detalle: 'Limpieza y fluoración', precio: 10000 },
  { codigo: 'EJ-04', detalle: 'Extracción simple', precio: 20000 },
];

// Prácticas de cada consulta realizada: pieza FDI + cara (sin cara = pieza entera; sin pieza = general)
const CONSULTAS = [
  {
    diasAtras: 60,
    observaciones: `${MARCA} Control inicial. Caries en 16 y 21.`,
    practicas: [
      { codigo: 'EJ-03' },
      { codigo: 'EJ-01', diente: 16, cara: 'Oclusal' },
      { codigo: 'EJ-01', diente: 16, cara: 'Mesial' },
      { codigo: 'EJ-01', diente: 21, cara: 'Vestibular' },
    ],
  },
  {
    diasAtras: 14,
    observaciones: `${MARCA} Selladores y extracción de pieza 46.`,
    practicas: [
      { codigo: 'EJ-02', diente: 26, cara: 'Cruzal' },
      { codigo: 'EJ-02', diente: 36, cara: 'Cruzal' },
      { codigo: 'EJ-01', diente: 36, cara: 'Lingual' },
      { codigo: 'EJ-04', diente: 46 },
    ],
  },
];

const haceDias = (dias: number, hora: number) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  fecha.setHours(hora, 0, 0, 0);
  return fecha;
};

async function seedEjemplos() {
  console.log('Revisando datos de ejemplo del odontograma...');

  const paciente = await prisma.paciente.findFirst({ where: { usuario: { email: 'paciente@consultorio.com' } } });
  const odontologo = await prisma.odontologo.findFirst({ where: { usuario: { email: 'odonto@consultorio.com' } } });
  if (!paciente || !odontologo) {
    console.log('⚠️  Faltan los usuarios de prueba (seed_auth.ts). No se cargaron ejemplos.');
    return;
  }

  const yaCargados = await prisma.reserva.count({
    where: { paciente_id: paciente.id, observaciones: { startsWith: MARCA } },
  });
  if (yaCargados > 0) {
    console.log('✅ Los datos de ejemplo ya estaban cargados.');
    return;
  }

  // Catálogo de prácticas de ejemplo
  for (const p of PRACTICAS) {
    await prisma.practica.upsert({ where: { codigo: p.codigo }, update: {}, create: p });
  }
  const practicas = await prisma.practica.findMany({ where: { codigo: { in: PRACTICAS.map((p) => p.codigo) } } });
  const idPractica = new Map(practicas.map((p) => [p.codigo, p.id]));

  // Piezas con sus caras (diente_cara)
  const dientes = await prisma.diente.findMany({ include: { caras: { include: { cara: true } } } });
  const dientePorNumero = new Map(dientes.map((d) => [d.numero, d]));

  const odontograma = await prisma.odontograma.upsert({
    where: { paciente_id: paciente.id },
    update: {},
    create: { paciente_id: paciente.id, estado: 'Activo' },
  });

  // Consultas ya realizadas, con sus prácticas
  for (const c of CONSULTAS) {
    const fecha = haceDias(c.diasAtras, 10);
    const reserva = await prisma.reserva.create({
      data: {
        paciente_id: paciente.id,
        odontologo_id: odontologo.id,
        fecha_creacion: fecha,
        estado: 'realizada',
        fechaRealizacion: fecha,
        resultado: 'exitoso',
        observaciones: c.observaciones,
      },
    });
    await prisma.turno.create({
      data: { fecha_hora_inicio: fecha, duracion: 30, estado: 'ocupado', odontologo_id: odontologo.id, reserva_id: reserva.id_reserva },
    });

    for (const p of c.practicas) {
      const diente = p.diente !== undefined ? dientePorNumero.get(p.diente) : undefined;
      const cara = p.cara ? diente?.caras.find((dc) => dc.cara.nombre === p.cara)?.cara : undefined;
      if (p.cara && !cara) {
        console.log(`⚠️  La pieza ${p.diente} no tiene la cara ${p.cara}; se omite.`);
        continue;
      }
      await prisma.detalle.create({
        data: {
          fecha_realizacion: fecha,
          reserva_id: reserva.id_reserva,
          odontograma_id: odontograma.id,
          practica_id: idPractica.get(p.codigo)!,
          diente_id: diente?.id,
          cara_id: cara?.id,
        },
      });
    }
  }

  // Un turno confirmado para hoy, para probar la atención y marcar caras nuevas
  const hoy = new Date();
  hoy.setHours(hoy.getHours() + 1, 0, 0, 0);
  const pendiente = await prisma.reserva.create({
    data: {
      paciente_id: paciente.id,
      odontologo_id: odontologo.id,
      estado: 'confirmada',
      observaciones: `${MARCA} Control de seguimiento.`,
    },
  });
  await prisma.turno.create({
    data: { fecha_hora_inicio: hoy, duracion: 30, estado: 'ocupado', odontologo_id: odontologo.id, reserva_id: pendiente.id_reserva },
  });

  console.log('🧪 Se cargaron 2 consultas realizadas con prácticas por cara y 1 turno confirmado para hoy (paciente María Gómez).');
}

seedEjemplos()
  .catch((e) => {
    console.error('Error cargando los datos de ejemplo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
