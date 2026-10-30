import prisma from '../lib/prisma';

// Piezas permanentes según numeración FDI (11-48).
// Cuadrantes: 1 = superior derecho, 2 = superior izquierdo,
//             3 = inferior izquierdo, 4 = inferior derecho.
const CUADRANTES = [
  { base: 10, arcada: 'Superior', lado: 'Derecho' },
  { base: 20, arcada: 'Superior', lado: 'Izquierdo' },
  { base: 30, arcada: 'Inferior', lado: 'Izquierdo' },
  { base: 40, arcada: 'Inferior', lado: 'Derecho' },
];

// Posición dentro del cuadrante permanente (1 a 8)
const POSICIONES = [
  { nombre: 'Incisivo Central', tipo: 'Incisivo' },
  { nombre: 'Incisivo Lateral', tipo: 'Incisivo' },
  { nombre: 'Canino', tipo: 'Canino' },
  { nombre: 'Primer Premolar', tipo: 'Premolar' },
  { nombre: 'Segundo Premolar', tipo: 'Premolar' },
  { nombre: 'Primer Molar', tipo: 'Molar' },
  { nombre: 'Segundo Molar', tipo: 'Molar' },
  { nombre: 'Muela del Juicio', tipo: 'Molar' },
];

// Piezas de leche (51-85). Mismos cuadrantes que los permanentes, con 5 piezas.
const CUADRANTES_LECHE = [
  { base: 50, arcada: 'Superior', lado: 'Derecho' },
  { base: 60, arcada: 'Superior', lado: 'Izquierdo' },
  { base: 70, arcada: 'Inferior', lado: 'Izquierdo' },
  { base: 80, arcada: 'Inferior', lado: 'Derecho' },
];

const POSICIONES_LECHE = [
  { nombre: 'Incisivo Central', tipo: 'Incisivo' },
  { nombre: 'Incisivo Lateral', tipo: 'Incisivo' },
  { nombre: 'Canino', tipo: 'Canino' },
  { nombre: 'Primer Molar', tipo: 'Molar' },
  { nombre: 'Segundo Molar', tipo: 'Molar' },
];

// Caras (superficies) del diente
const CARAS = [
  { nombre: 'Vestibular', detalle: 'Cara externa del diente, en contacto con los labios o mejillas' },
  { nombre: 'Lingual', detalle: 'Cara interna del diente en la arcada inferior (mandíbula), en contacto con la lengua' },
  { nombre: 'Palatina', detalle: 'Cara interna del diente en la arcada superior (maxilar), en contacto con el paladar' },
  { nombre: 'Mesial', detalle: 'Cara orientada hacia la línea media de la boca' },
  { nombre: 'Distal', detalle: 'Cara orientada hacia la parte posterior de la boca' },
  { nombre: 'Incisal', detalle: 'Borde de corte de incisivos y caninos' },
  { nombre: 'Oclusal', detalle: 'Superficie de masticación de premolares y molares' },
  { nombre: 'Cruzal', detalle: 'Cara indicada con la letra C en el mapa de caras (definición a confirmar)' },
];

// Mapa de caras por rango de piezas (numeración permanente).
// Las piezas de leche usan el mismo mapa: 5X equivale a 1X (51 = 11, 52 = 12, etc.).
// Si un diente cae en varios rangos, recibe todas esas caras (sin repetir).
const MAPA_CARAS: { desde: number; hasta: number; caras: string[] }[] = [
  { desde: 11, hasta: 18, caras: ['Vestibular', 'Mesial', 'Palatina', 'Distal'] },
  { desde: 21, hasta: 28, caras: ['Vestibular', 'Distal', 'Palatina', 'Mesial'] },
  { desde: 41, hasta: 48, caras: ['Lingual', 'Mesial', 'Vestibular', 'Distal'] },
  { desde: 31, hasta: 38, caras: ['Lingual', 'Mesial', 'Distal', 'Vestibular'] },
  { desde: 14, hasta: 18, caras: ['Oclusal'] },
  { desde: 24, hasta: 28, caras: ['Cruzal'] },
  { desde: 34, hasta: 38, caras: ['Cruzal'] },
  { desde: 44, hasta: 48, caras: ['Cruzal'] },
  { desde: 11, hasta: 13, caras: ['Incisal'] },
  { desde: 21, hasta: 23, caras: ['Incisal'] },
  { desde: 31, hasta: 33, caras: ['Incisal'] },
  { desde: 41, hasta: 43, caras: ['Incisal'] },
];

function carasParaDiente(numero: number): string[] {
  // Piezas de leche (51-85) se equiparan a la permanente de la misma posición (51 -> 11)
  const equivalente = numero >= 50 ? numero - 40 : numero;
  const caras = new Set<string>();
  for (const regla of MAPA_CARAS) {
    if (equivalente >= regla.desde && equivalente <= regla.hasta) {
      regla.caras.forEach((c) => caras.add(c));
    }
  }
  return [...caras];
}

function construirDientes() {
  const dientes: { numero: number; nombre: string; tipo: string }[] = [];
  for (const c of CUADRANTES) {
    POSICIONES.forEach((p, i) => {
      dientes.push({
        numero: c.base + i + 1,
        nombre: `${p.nombre} ${c.arcada} ${c.lado}`,
        tipo: p.tipo,
      });
    });
  }
  for (const c of CUADRANTES_LECHE) {
    POSICIONES_LECHE.forEach((p, i) => {
      dientes.push({
        numero: c.base + i + 1,
        nombre: `${p.nombre} de leche ${c.arcada} ${c.lado}`,
        tipo: p.tipo,
      });
    });
  }
  return dientes;
}

// Bases creadas antes de guardar la cara en las prácticas: agrega detalle.cara_id si falta
// (init.sql sólo se ejecuta al crear el volumen de la base, no en una base ya existente)
async function asegurarColumnaCara() {
  const columnas = await prisma.$queryRaw<{ total: bigint }[]>`
    SELECT COUNT(*) AS total FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'detalle' AND COLUMN_NAME = 'cara_id'`;
  if (Number(columnas[0].total) > 0) return;

  await prisma.$executeRawUnsafe('ALTER TABLE `detalle` ADD COLUMN `cara_id` int unsigned DEFAULT NULL AFTER `diente_id`');
  await prisma.$executeRawUnsafe(
    'ALTER TABLE `detalle` ADD CONSTRAINT `fk_detalle_cara` FOREIGN KEY (`cara_id`) REFERENCES `cara` (`id`) ON DELETE SET NULL ON UPDATE CASCADE'
  );
  console.log('🛠️  Se agregó la columna detalle.cara_id.');
}

async function seedDientes() {
  await asegurarColumnaCara();

  console.log('Revisando piezas dentales (FDI)...');

  // 1. Piezas dentales
  const todos = construirDientes();
  const existentes = await prisma.diente.findMany({ select: { numero: true } });
  const numerosExistentes = new Set(existentes.map((d) => d.numero));
  const faltantes = todos.filter((d) => !numerosExistentes.has(d.numero));

  if (faltantes.length === 0) {
    console.log(`✅ Las ${todos.length} piezas dentales ya estaban cargadas.`);
  } else {
    await prisma.diente.createMany({ data: faltantes });
    console.log(`🦷 Se cargaron ${faltantes.length} piezas dentales que faltaban (de ${todos.length}).`);
  }

  // 2. Caras
  const carasExistentes = await prisma.cara.findMany({ select: { id: true, nombre: true } });
  const nombresCaras = new Set(carasExistentes.map((c) => c.nombre));
  const carasFaltantes = CARAS.filter((c) => !nombresCaras.has(c.nombre));

  if (carasFaltantes.length > 0) {
    await prisma.cara.createMany({ data: carasFaltantes });
    console.log(`🔷 Se cargaron ${carasFaltantes.length} caras.`);
  } else {
    console.log('✅ Las caras ya estaban cargadas.');
  }

  // 3. Relación diente-cara según el mapa
  const caras = await prisma.cara.findMany({ select: { id: true, nombre: true } });
  const idCara = new Map(caras.map((c) => [c.nombre, c.id]));

  const dientesBD = await prisma.diente.findMany({ select: { id: true, numero: true } });
  const numerosFDI = new Set(todos.map((d) => d.numero));
  const relaciones: { diente_id: number; cara_id: number }[] = [];

  for (const d of dientesBD) {
    if (!numerosFDI.has(d.numero)) continue;
    for (const nombreCara of carasParaDiente(d.numero)) {
      const cara_id = idCara.get(nombreCara);
      if (cara_id !== undefined) relaciones.push({ diente_id: d.id, cara_id });
    }
  }

  // Se borran todas las relaciones y se vuelven a cargar, así la tabla queda igual al mapa
  const borradas = await prisma.dienteCara.deleteMany();
  await prisma.dienteCara.createMany({ data: relaciones });
  console.log(`🔗 Relaciones diente-cara: ${borradas.count} borradas, ${relaciones.length} cargadas según el mapa.`);
}

seedDientes()
  .catch((e) => {
    console.error('Error cargando piezas dentales, caras y relaciones:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });