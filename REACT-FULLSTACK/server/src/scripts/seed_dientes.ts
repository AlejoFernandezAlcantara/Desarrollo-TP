import prisma from '../lib/prisma';

// Las 32 piezas permanentes según numeración FDI.
// Cuadrantes: 1 = superior derecho, 2 = superior izquierdo,
//             3 = inferior izquierdo, 4 = inferior derecho.
const CUADRANTES = [
  { base: 10, arcada: 'Superior', lado: 'Derecho' },
  { base: 20, arcada: 'Superior', lado: 'Izquierdo' },
  { base: 30, arcada: 'Inferior', lado: 'Izquierdo' },
  { base: 40, arcada: 'Inferior', lado: 'Derecho' },
];

// Posición dentro del cuadrante (1 a 8)
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

// Caras (superficies) del diente
const CARAS = [
  { nombre: 'Vestibular', detalle: 'Cara externa del diente, en contacto con los labios o mejillas' },
  { nombre: 'Lingual', detalle: 'Cara interna del diente, en contacto con la lengua (Palatina en el maxilar superior)' },
  { nombre: 'Mesial', detalle: 'Cara orientada hacia la línea media de la boca' },
  { nombre: 'Distal', detalle: 'Cara orientada hacia la parte posterior de la boca' },
  { nombre: 'Incisal', detalle: 'Borde de corte de incisivos y caninos' },
  { nombre: 'Oclusal', detalle: 'Superficie de masticación de premolares y molares' },
];

// Caras que corresponden a cada tipo de diente
const CARAS_POR_TIPO: Record<string, string[]> = {
  Incisivo: ['Vestibular', 'Lingual', 'Mesial', 'Distal', 'Incisal'],
  Canino: ['Vestibular', 'Lingual', 'Mesial', 'Distal', 'Incisal'],
  Premolar: ['Vestibular', 'Lingual', 'Mesial', 'Distal', 'Oclusal'],
  Molar: ['Vestibular', 'Lingual', 'Mesial', 'Distal', 'Oclusal'],
};

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
  return dientes;
}

async function seedDientes() {
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

  // 3. Relación diente-cara (cada pieza con las caras que le corresponden)
  const caras = await prisma.cara.findMany({ select: { id: true, nombre: true } });
  const idCara = new Map(caras.map((c) => [c.nombre, c.id]));

  const dientesBD = await prisma.diente.findMany({ select: { id: true, numero: true } });
  const numerosFDI = new Set(todos.map((d) => d.numero));
  const relaciones: { diente_id: number; cara_id: number }[] = [];

  for (const d of dientesBD) {
    if (!numerosFDI.has(d.numero)) continue;
    const tipo = todos.find((t) => t.numero === d.numero)!.tipo;
    for (const nombreCara of CARAS_POR_TIPO[tipo]) {
      const cara_id = idCara.get(nombreCara);
      if (cara_id !== undefined) relaciones.push({ diente_id: d.id, cara_id });
    }
  }

  const antes = await prisma.dienteCara.count();
  // skipDuplicates evita duplicar las que ya existen
  await prisma.dienteCara.createMany({ data: relaciones, skipDuplicates: true });
  const despues = await prisma.dienteCara.count();
  console.log(`🔗 Relaciones diente-cara: ${despues - antes} nuevas (total: ${despues}).`);
}

seedDientes()
  .catch((e) => {
    console.error('Error cargando piezas dentales, caras y relaciones:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
