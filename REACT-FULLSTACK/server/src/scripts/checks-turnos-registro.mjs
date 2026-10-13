// Chequeos de turnos (solapamiento, disponibles, zona horaria) y registro público con mutual.
// Requiere Node 18+ y el server corriendo. Uso: node scripts/checks-turnos-registro.mjs
// Requiere que el seed (src/scripts/seed_auth.ts) ya esté cargado.

const BASE = process.env.BASE_URL || 'http://localhost:3001/api';
const RUN = String(Date.now()).slice(-8);
const rnd = (n) => Math.floor(Math.random() * n);

const SEED = {
  admin: { email: 'admin@consultorio.com', password: 'Admin123!' },
  odonto: { email: 'odonto@consultorio.com', password: 'Odonto123!' },
  paciente: { email: 'paciente@consultorio.com', password: 'Paciente123!' },
};

let passed = 0;
let warnings = 0;
const failed = [];

async function req(method, path, { body, cookie } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }

  return { status: res.status, text, json, setCookie: res.headers.get('set-cookie') };
}

function expectStatus(r, esperado, ctx) {
  if (r.status !== esperado) {
    throw new Error(`${ctx}: esperaba ${esperado}, recibió ${r.status} → ${r.text.slice(0, 200)}`);
  }
}

function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function test(nombre, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${nombre}`);
  } catch (e) {
    failed.push({ nombre, error: e.message });
    console.log(`  ❌ ${nombre}\n     ${e.message}`);
  }
}

function warn(nombre, msg) {
  warnings++;
  console.log(`  ⚠️  ${nombre}\n     ${msg}`);
}

async function login(cred) {
  const r = await req('POST', '/auth/login', { body: cred });
  expectStatus(r, 200, `login ${cred.email}`);
  return { cookie: r.setCookie.split(';')[0], usuario: r.json.usuario };
}

// Fecha YYYY-MM-DD (en UTC) a N días desde hoy
const diaDesdeHoy = (dias) => new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
// Día anterior de una fecha YYYY-MM-DD
const diaAnterior = (dia) => new Date(new Date(dia + 'T00:00:00Z').getTime() - 86400000).toISOString().slice(0, 10);
// Fecha y hora en UTC. Argentina es UTC-3: 12:00Z son las 09:00 locales
const enUTC = (dia, hhmm) => `${dia}T${hhmm}:00.000Z`;
// CUIT de 11 dígitos, único por ejecución
const cuitRandom = () => '3' + String(Date.now()).slice(-7) + String(rnd(1000)).padStart(3, '0');
const dniRandom = () => String(30000000 + rnd(9000000));

async function main() {
  console.log(`\nChequeos de turnos y registro público (${BASE}, run ${RUN})\n`);
  const s = {};

  s.admin = await login(SEED.admin);
  s.odonto = await login(SEED.odonto);
  s.paciente = await login(SEED.paciente);

  // Odontólogo propio de esta corrida: sus turnos no chocan con los de otras corridas
  const odo = await req('POST', '/odontologos', {
    cookie: s.admin.cookie,
    body: {
      nombre: 'Check', apellido: 'Turnos' + RUN, email: `chk.odo.${RUN}@test.com`, password: 'Test123!',
      nro_Matricula: 700000 + rnd(99999), especialidad: 'Test', nroDocumento: dniRandom(), tipoDoc: 'DNI',
    },
  });
  expectStatus(odo, 201, 'crear odontólogo de prueba');
  const odId = odo.json.data.id;
  const odSeedId = s.odonto.usuario.personaId;
  const pacId = s.paciente.usuario.personaId;

  const crearTurno = (fecha, duracion, odontologo_id) =>
    req('POST', '/turnos', { cookie: s.admin.cookie, body: { fecha_hora_inicio: fecha, duracion, odontologo_id } });

  const disponiblesDe = async (fecha) => {
    const r = await req('GET', `/turnos/disponibles?odontologoId=${odId}&fecha=${fecha}`);
    expectStatus(r, 200, `disponibles ${fecha}`);
    return r.json.data;
  };

  // ── 1. Solapamiento ───────────────────────────────────────────────────
  console.log('1. Solapamiento de turnos');

  const dia = diaDesdeHoy(300 + rnd(500));
  let t1, t3;

  await test('crear turno base 12:00 (30 min)', async () => {
    const r = await crearTurno(enUTC(dia, '12:00'), 30, odId);
    expectStatus(r, 201, 'turno base');
    t1 = r.json.data;
  });

  await test('turno que empieza dentro de otro (12:15, 30 min) responde 409', async () => {
    expectStatus(await crearTurno(enUTC(dia, '12:15'), 30, odId), 409, 'inicio dentro');
  });

  await test('turno que empieza antes y pisa el inicio (11:45, 30 min) responde 409', async () => {
    expectStatus(await crearTurno(enUTC(dia, '11:45'), 30, odId), 409, 'pisa inicio');
  });

  await test('turno que contiene a otro (11:50, 60 min) responde 409', async () => {
    expectStatus(await crearTurno(enUTC(dia, '11:50'), 60, odId), 409, 'contiene');
  });

  await test('turno pegado después (12:30) se permite', async () => {
    const r = await crearTurno(enUTC(dia, '12:30'), 30, odId);
    expectStatus(r, 201, 'pegado después');
    t3 = r.json.data;
  });

  await test('turno pegado antes (11:30, termina 12:00) se permite', async () => {
    expectStatus(await crearTurno(enUTC(dia, '11:30'), 30, odId), 201, 'pegado antes');
  });

  await test('mismo horario con otro odontólogo se permite', async () => {
    expectStatus(await crearTurno(enUTC(dia, '12:00'), 30, odSeedId), 201, 'otro odontólogo');
  });

  await test('reprogramar a un horario que choca responde 409', async () => {
    const r = await req('PUT', `/turnos/${t3.codigo}`, {
      cookie: s.admin.cookie,
      body: { fecha_hora_inicio: enUTC(dia, '12:10') },
    });
    expectStatus(r, 409, 'reprogramar con choque');
  });

  await test('reprogramar a un horario libre responde 200', async () => {
    const r = await req('PUT', `/turnos/${t3.codigo}`, {
      cookie: s.admin.cookie,
      body: { fecha_hora_inicio: enUTC(dia, '13:00') },
    });
    expectStatus(r, 200, 'reprogramar libre');
  });

  await test('cambiar solo la duración no choca consigo mismo', async () => {
    const r = await req('PUT', `/turnos/${t3.codigo}`, {
      cookie: s.admin.cookie,
      body: { duracion: 45 },
    });
    expectStatus(r, 200, 'cambiar duración');
  });

  // ── 2. Turnos disponibles ─────────────────────────────────────────────
  console.log('\n2. Turnos disponibles');

  const dia2 = diaDesdeHoy(800 + rnd(300));
  let t5, reservaDisp;

  await test('crear turno libre 14:00', async () => {
    const r = await crearTurno(enUTC(dia2, '14:00'), 30, odId);
    expectStatus(r, 201, 'turno libre');
    t5 = r.json.data;
  });

  await test('el turno libre aparece en disponibles del día y del odontólogo', async () => {
    const lista = await disponiblesDe(dia2);
    const item = lista.find((t) => t.codigo === t5.codigo);
    expect(item, 'el turno no aparece en disponibles');
    expect(item.odontologo.id === odId, 'el odontólogo del turno no coincide');
  });

  await test('al reservarlo deja de aparecer en disponibles', async () => {
    const r = await req('POST', '/reservas', {
      cookie: s.paciente.cookie,
      body: { paciente_id: pacId, turno_codigo: t5.codigo },
    });
    expectStatus(r, 201, 'reservar');
    reservaDisp = r.json.data;

    const lista = await disponiblesDe(dia2);
    expect(!lista.some((t) => t.codigo === t5.codigo), 'el turno reservado sigue apareciendo como libre');
  });

  await test('al cancelar la reserva vuelve a aparecer', async () => {
    expectStatus(
      await req('PUT', `/reservas/${reservaDisp.id_reserva}/cancelar`, { cookie: s.paciente.cookie, body: {} }),
      200,
      'cancelar'
    );
    const lista = await disponiblesDe(dia2);
    expect(lista.some((t) => t.codigo === t5.codigo), 'el turno no volvió a libre');
  });

  await test('fecha pasada devuelve lista vacía (200)', async () => {
    const r = await req('GET', `/turnos/disponibles?odontologoId=${odId}&fecha=2020-01-01`);
    expectStatus(r, 200, 'fecha pasada');
    expect(r.json.data.length === 0, 'devolvió turnos para una fecha pasada');
  });

  await test('formato de fecha inválido responde 400', async () => {
    expectStatus(await req('GET', `/turnos/disponibles?fecha=01-01-2030`), 400, 'formato');
  });

  await test('fecha inexistente (2030-02-31) responde 400', async () => {
    expectStatus(await req('GET', `/turnos/disponibles?fecha=2030-02-31`), 400, 'fecha inexistente');
  });

  // ── 3. Zona horaria (Argentina = UTC-3) ───────────────────────────────
  console.log('\n3. Zona horaria (Argentina = UTC-3)');

  const diaTZ = diaDesdeHoy(1200 + rnd(200));
  const diaAR = diaAnterior(diaTZ);
  let t6;

  await test('crear turno a las 01:00 UTC (22:00 del día anterior en Argentina)', async () => {
    const r = await crearTurno(enUTC(diaTZ, '01:00'), 30, odId);
    expectStatus(r, 201, 'turno 01:00 UTC');
    t6 = r.json.data;
  });

  await test('la búsqueda por fecha respeta el día de Argentina', async () => {
    const enARDia = (await disponiblesDe(diaAR)).some((t) => t.codigo === t6.codigo);
    expect(enARDia, `el turno de las 22:00 del ${diaAR} no aparece al buscar ${diaAR}`);
  });
  // ── 4. Registro público con mutual ───────────────────────────────────
  console.log('\n4. Registro público con mutual');

  let mutual;

  await test('admin crea una mutual de prueba', async () => {
    const r = await req('POST', '/mutuales', {
      cookie: s.admin.cookie,
      body: { cuit: cuitRandom(), nombre: 'Mutual Registro ' + RUN },
    });
    expectStatus(r, 201, 'crear mutual');
    mutual = r.json.data;
  });

  const emailReg = (k) => `reg.${RUN}.${k}@test.com`;
  const datosRegistro = (k, extra = {}) => ({
    nombre: 'Registro', apellido: 'Mutual', email: emailReg(k), password: 'Test123!',
    direccion: 'Calle Reg 123', nroDocumento: dniRandom(), tipoDoc: 'DNI', ...extra,
  });

  let regUser;

  await test('registro con mutual y nroAfiliado responde 201 y vincula la mutual', async () => {
    const r = await req('POST', '/auth/register/paciente', {
      body: datosRegistro('a', { mutual_id: mutual.id, nroAfiliado: 'R-' + RUN, cubre: 80 }),
    });
    expectStatus(r, 201, 'registro con mutual');

    regUser = await login({ email: emailReg('a'), password: 'Test123!' });
    const ficha = await req('GET', `/pacientes/${regUser.usuario.personaId}`, { cookie: s.admin.cookie });
    expectStatus(ficha, 200, 'ficha del paciente registrado');

    const vinculo = ficha.json.data.mutuales.find((m) => m.mutual_id === mutual.id);
    expect(vinculo, 'el paciente no quedó vinculado a la mutual');
    expect(vinculo.cubre === 80, `cubre esperado 80, llegó ${vinculo.cubre}`);
    expect(vinculo.nroAfiliado === 'R-' + RUN, 'nroAfiliado no coincide');
  });

  await test('mutual sin nroAfiliado responde 400', async () => {
    const r = await req('POST', '/auth/register/paciente', {
      body: datosRegistro('b', { mutual_id: mutual.id }),
    });
    expectStatus(r, 400, 'mutual sin nroAfiliado');
  });

  await test('cubre fuera de rango (150) responde 400', async () => {
    const r = await req('POST', '/auth/register/paciente', {
      body: datosRegistro('c', { mutual_id: mutual.id, nroAfiliado: 'R-1', cubre: 150 }),
    });
    expectStatus(r, 400, 'cubre 150');
  });

  await test('mutual inexistente responde 404 y no crea el usuario', async () => {
    const r = await req('POST', '/auth/register/paciente', {
      body: datosRegistro('d', { mutual_id: 999999, nroAfiliado: 'R-2' }),
    });
    expectStatus(r, 404, 'mutual inexistente');

    const intento = await req('POST', '/auth/login', { body: { email: emailReg('d'), password: 'Test123!' } });
    expectStatus(intento, 401, 'login del usuario que no debía crearse');
  });

  // ── Resultado ─────────────────────────────────────────────────────────
  console.log(`\nResultado: ${passed} OK, ${failed.length} fallidas, ${warnings} avisos`);
  if (failed.length) {
    console.log('Fallidas:');
    failed.forEach((f) => console.log(`  - ${f.nombre}`));
  }
  console.log(`\nDatos de prueba con sufijo ${RUN} (no se borran por las claves foráneas).`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error('Error inesperado:', e);
  process.exit(1);
});