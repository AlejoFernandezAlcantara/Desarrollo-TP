// Prueba de humo del backend: recorre los flujos principales y verifica permisos.
// Requiere Node 18+ (fetch nativo). Sin dependencias.
// Uso: node scripts/smoke-test.mjs
//      BASE_URL=http://localhost:3001/api node scripts/smoke-test.mjs

const BASE = process.env.BASE_URL || 'http://localhost:3001/api';
const RUN = String(Date.now()).slice(-8); // sufijo único por ejecución
const rnd = (n) => Math.floor(Math.random() * n);

// Usuarios creados por src/scripts/seed_auth.ts
const SEED = {
  admin: { email: 'admin@consultorio.com', password: 'Admin123!' },
  odonto: { email: 'odonto@consultorio.com', password: 'Odonto123!' },
  paciente: { email: 'paciente@consultorio.com', password: 'Paciente123!' },
};

let passed = 0;
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

async function login(cred) {
  const r = await req('POST', '/auth/login', { body: cred });
  expectStatus(r, 200, `login ${cred.email}`);
  return { cookie: r.setCookie.split(';')[0], usuario: r.json.usuario, cred };
}

const futuro = () => {
  const d = new Date(Date.now() + (60 + rnd(700)) * 86400000);
  d.setUTCHours(10, 0, 0, 0);
  return d.toISOString();
};

async function main() {
  console.log(`\nPrueba de humo contra ${BASE} (run ${RUN})\n`);
  const s = {};

  // ── Conectividad y login ────────────────────────────────────────────────
  console.log('Conectividad y login');

  await test('la API responde', async () => {
    expectStatus(await req('GET', ''), 200, 'GET /api');
  });

  await test('login de admin, odontólogo y paciente sembrados', async () => {
    s.admin = await login(SEED.admin);
    s.odonto = await login(SEED.odonto);
    s.paciente = await login(SEED.paciente);
    expect(s.admin.usuario.rol === 'ADMINISTRADOR', 'rol admin incorrecto');
    expect(s.odonto.usuario.rol === 'ODONTOLOGO', 'rol odontólogo incorrecto');
    expect(s.paciente.usuario.rol === 'PACIENTE', 'rol paciente incorrecto');
  });

  await test('contraseña incorrecta responde 401', async () => {
    const r = await req('POST', '/auth/login', { body: { email: SEED.admin.email, password: 'mal' } });
    expectStatus(r, 401, 'login inválido');
  });

  await test('login sin datos responde 400', async () => {
    expectStatus(await req('POST', '/auth/login', { body: {} }), 400, 'login vacío');
  });

  await test('/auth/me devuelve el rol de la cookie', async () => {
    const r = await req('GET', '/auth/me', { cookie: s.paciente.cookie });
    expectStatus(r, 200, 'GET /auth/me');
    expect(r.json.usuario.rol === 'PACIENTE', 'rol incorrecto en /me');
  });

  // ── Autorización ────────────────────────────────────────────────────────
  console.log('\nAutorización');

  await test('sin token responde 401', async () => {
    expectStatus(await req('GET', '/pacientes'), 401, 'GET /pacientes sin token');
  });

  await test('paciente no puede listar odontólogos (403)', async () => {
    expectStatus(await req('GET', '/odontologos', { cookie: s.paciente.cookie }), 403, 'paciente → odontólogos');
  });

  await test('paciente no puede crear mutuales (403)', async () => {
    const r = await req('POST', '/mutuales', {
      cookie: s.paciente.cookie,
      body: { cuit: '30111222333', nombre: 'Test' },
    });
    expectStatus(r, 403, 'paciente → POST mutuales');
  });

  // ── Seguridad de datos ──────────────────────────────────────────────────
  console.log('\nSeguridad de datos');

  await test('ninguna lista expone password_hash', async () => {
    for (const path of ['/pacientes', '/odontologos', '/turnos', '/reservas']) {
      const r = await req('GET', path, { cookie: s.admin.cookie });
      expectStatus(r, 200, `GET ${path}`);
      expect(!r.text.includes('password_hash'), `${path} incluye password_hash`);
    }
  });

  await test('admin puede listar usuarios', async () => {
    expectStatus(await req('GET', '/usuarios', { cookie: s.admin.cookie }), 200, 'GET /usuarios');
  });

  // ── Catálogos públicos ──────────────────────────────────────────────────
  console.log('\nCatálogos públicos');

  await test('mutuales, prácticas, dientes y caras son públicos', async () => {
    for (const path of ['/mutuales', '/practicas', '/dientes', '/caras']) {
      const r = await req('GET', path);
      expectStatus(r, 200, `GET ${path}`);
      expect(Array.isArray(r.json?.data), `${path} no devuelve { data: [] }`);
    }
  });

  // ── Validaciones ────────────────────────────────────────────────────────
  console.log('\nValidaciones');

  await test('id inválido en la URL responde 400', async () => {
    expectStatus(await req('GET', '/reservas/abc', { cookie: s.admin.cookie }), 400, 'id inválido');
  });

  await test('filtro de estado inválido responde 400', async () => {
    expectStatus(await req('GET', '/reservas?estado=xxx', { cookie: s.admin.cookie }), 400, 'estado inválido');
  });

  await test('paciente sin password responde 400', async () => {
    const r = await req('POST', '/pacientes', {
      cookie: s.admin.cookie,
      body: { nombre: 'X', apellido: 'Y', email: `x.${RUN}@test.com`, direccion: 'Calle 123', nroDocumento: '12345678', tipoDoc: 'DNI' },
    });
    expectStatus(r, 400, 'paciente sin password');
  });

  await test('turno en el pasado responde 400', async () => {
    const r = await req('POST', '/turnos', {
      cookie: s.admin.cookie,
      body: { fecha_hora_inicio: '2020-01-01T10:00:00Z', duracion: 30, odontologo_id: s.odonto.usuario.personaId },
    });
    expectStatus(r, 400, 'turno pasado');
  });

  await test('turno con duración 0 responde 400', async () => {
    const r = await req('POST', '/turnos', {
      cookie: s.admin.cookie,
      body: { fecha_hora_inicio: futuro(), duracion: 0, odontologo_id: s.odonto.usuario.personaId },
    });
    expectStatus(r, 400, 'duración 0');
  });

  // ── Datos base del flujo ────────────────────────────────────────────────
  console.log('\nDatos base (sufijo ' + RUN + ')');

  await test('admin crea mutual, práctica y turno', async () => {
    const m = await req('POST', '/mutuales', {
      cookie: s.admin.cookie,
      body: { cuit: '3' + RUN + '01', nombre: 'Mutual Test ' + RUN },
    });
    expectStatus(m, 201, 'crear mutual');
    s.mutual = m.json.data;

    const p = await req('POST', '/practicas', {
      cookie: s.admin.cookie,
      body: { codigo: 'T' + RUN, detalle: 'Práctica test ' + RUN, precio: 1500 },
    });
    expectStatus(p, 201, 'crear práctica');
    s.practica = p.json.data;

    const t = await req('POST', '/turnos', {
      cookie: s.admin.cookie,
      body: { fecha_hora_inicio: futuro(), duracion: 30, odontologo_id: s.odonto.usuario.personaId },
    });
    expectStatus(t, 201, 'crear turno');
    s.turno = t.json.data;
  });

  await test('admin crea un segundo paciente y un segundo odontólogo', async () => {
    const credP2 = { email: `pac2.${RUN}@test.com`, password: 'Test123!' };
    const credO2 = { email: `odo2.${RUN}@test.com`, password: 'Test123!' };

    const p = await req('POST', '/pacientes', {
      cookie: s.admin.cookie,
      body: {
        nombre: 'Paciente', apellido: 'Dos', ...credP2,
        direccion: 'Calle Test 123', nroDocumento: String(30000000 + rnd(9000000)), tipoDoc: 'DNI',
      },
    });
    expectStatus(p, 201, 'crear paciente 2');

    const o = await req('POST', '/odontologos', {
      cookie: s.admin.cookie,
      body: {
        nombre: 'Odonto', apellido: 'Dos', ...credO2,
        nro_Matricula: 800000 + rnd(99999), especialidad: 'Test',
        nroDocumento: String(30000000 + rnd(9000000)), tipoDoc: 'DNI',
      },
    });
    expectStatus(o, 201, 'crear odontólogo 2');

    s.paciente2 = await login(credP2);
    s.odonto2 = await login(credO2);
  });

  // ── Flujo de reservas ───────────────────────────────────────────────────
  console.log('\nFlujo de reservas');

  await test('paciente reserva el turno (CUU 1)', async () => {
    const r = await req('POST', '/reservas', {
      cookie: s.paciente.cookie,
      body: { paciente_id: s.paciente.usuario.personaId, turno_codigo: s.turno.codigo },
    });
    expectStatus(r, 201, 'reservar');
    s.reserva1 = r.json.data;
    expect(s.reserva1.estado === 'confirmada', 'la reserva no quedó confirmada');
  });

  await test('reservar un turno ya ocupado responde 409', async () => {
    const r = await req('POST', '/reservas', {
      cookie: s.paciente.cookie,
      body: { paciente_id: s.paciente.usuario.personaId, turno_codigo: s.turno.codigo },
    });
    expectStatus(r, 409, 'turno ocupado');
  });

  await test('paciente no puede reservar para otro paciente (403)', async () => {
    const r = await req('POST', '/reservas', {
      cookie: s.paciente.cookie,
      body: { paciente_id: s.paciente.usuario.personaId + 1000, turno_codigo: s.turno.codigo },
    });
    expectStatus(r, 403, 'reservar para otro');
  });

  await test('paciente sólo ve sus propias reservas', async () => {
    const r = await req('GET', '/reservas', { cookie: s.paciente.cookie });
    expectStatus(r, 200, 'GET /reservas');
    expect(r.json.data.every((x) => x.paciente_id === s.paciente.usuario.personaId), 've reservas ajenas');
  });

  await test('odontólogo registra una práctica realizada (CUU 2)', async () => {
    const r = await req('POST', '/detalles', {
      cookie: s.odonto.cookie,
      body: { reserva_id: s.reserva1.id_reserva, practica_id: s.practica.id, observaciones: 'prueba' },
    });
    expectStatus(r, 201, 'crear detalle');
    s.detalle = r.json.data;
  });

  await test('paciente dueño ve su detalle (200)', async () => {
    expectStatus(await req('GET', `/detalles/${s.detalle.id}`, { cookie: s.paciente.cookie }), 200, 'detalle propio');
  });

  await test('paciente ajeno recibe 404 al pedir ese detalle', async () => {
    expectStatus(await req('GET', `/detalles/${s.detalle.id}`, { cookie: s.paciente2.cookie }), 404, 'detalle ajeno');
  });

  await test('paciente ajeno no ve el detalle en el listado', async () => {
    const r = await req('GET', `/detalles?reservaId=${s.reserva1.id_reserva}`, { cookie: s.paciente2.cookie });
    expectStatus(r, 200, 'listado detalles');
    expect(r.json.data.length === 0, 'el paciente ajeno ve detalles de otra reserva');
  });

  await test('paciente ajeno no puede cancelar la reserva (403)', async () => {
    expectStatus(await req('PUT', `/reservas/${s.reserva1.id_reserva}/cancelar`, { cookie: s.paciente2.cookie, body: {} }), 403, 'cancelar ajena');
  });

  await test('odontólogo ajeno no puede cancelar la reserva (403)', async () => {
    expectStatus(await req('PUT', `/reservas/${s.reserva1.id_reserva}/cancelar`, { cookie: s.odonto2.cookie, body: {} }), 403, 'odontólogo ajeno cancela');
  });

  await test('paciente cancela su reserva y el turno vuelve a libre', async () => {
    const c = await req('PUT', `/reservas/${s.reserva1.id_reserva}/cancelar`, { cookie: s.paciente.cookie, body: { motivo: 'test' } });
    expectStatus(c, 200, 'cancelar propia');
    expect(c.json.data.estado === 'cancelada', 'estado no quedó cancelada');

    const t = await req('GET', `/turnos/${s.turno.codigo}`, { cookie: s.admin.cookie });
    expectStatus(t, 200, 'GET turno');
    expect(t.json.data.estado === 'libre' && t.json.data.reserva_id === null, 'el turno no se liberó');
  });

  await test('odontólogo cancela su propia reserva (200)', async () => {
    const r = await req('POST', '/reservas', {
      cookie: s.paciente.cookie,
      body: { paciente_id: s.paciente.usuario.personaId, turno_codigo: s.turno.codigo },
    });
    expectStatus(r, 201, 'reservar de nuevo');
    s.reserva2 = r.json.data;

    expectStatus(await req('PUT', `/reservas/${s.reserva2.id_reserva}/cancelar`, { cookie: s.odonto2.cookie, body: {} }), 403, 'odontólogo ajeno cancela');

    expectStatus(await req('PUT', `/reservas/${s.reserva2.id_reserva}/cancelar`, { cookie: s.odonto.cookie, body: {} }), 200, 'odontólogo propio cancela');
  });

  await test('odontólogo ajeno no puede finalizar la reserva (403)', async () => {
    const r = await req('POST', '/reservas', {
      cookie: s.paciente.cookie,
      body: { paciente_id: s.paciente.usuario.personaId, turno_codigo: s.turno.codigo },
    });
    expectStatus(r, 201, 'reservar tercera vez');
    s.reserva3 = r.json.data;

    expectStatus(await req('PUT', `/reservas/${s.reserva3.id_reserva}/finalizar`, { cookie: s.odonto2.cookie, body: { resultado: 'exitoso' } }), 403, 'finalizar ajena');
  });

  await test('odontólogo finaliza su propia reserva (200)', async () => {
    const r = await req('PUT', `/reservas/${s.reserva3.id_reserva}/finalizar`, { cookie: s.odonto.cookie, body: { resultado: 'exitoso' } });
    expectStatus(r, 200, 'finalizar propia');
    expect(r.json.data.estado === 'realizada', 'estado no quedó realizada');
  });

  // ── Mutuales del paciente ───────────────────────────────────────────────
  console.log('\nMutuales del paciente');

  await test('admin asocia y desasocia una mutual al paciente', async () => {
    const pid = s.paciente.usuario.personaId;
    const a = await req('POST', `/pacientes/${pid}/mutuales/${s.mutual.id}`, { cookie: s.admin.cookie, body: { nroAfiliado: 'A-' + RUN } });
    expectStatus(a, 200, 'asociar mutual');

    const d = await req('DELETE', `/pacientes/${pid}/mutuales/${s.mutual.id}`, { cookie: s.admin.cookie });
    expectStatus(d, 204, 'desasociar mutual');
  });

  // ── Resultado ───────────────────────────────────────────────────────────
  console.log(`\nResultado: ${passed} OK, ${failed.length} fallidas`);
  if (failed.length) {
    console.log('Fallidas:');
    failed.forEach((f) => console.log(`  - ${f.nombre}`));
    console.log(`\nLos datos de prueba quedaron con el sufijo ${RUN} (no se borran: turnos y reservas tienen FK).`);
    process.exit(1);
  }
  console.log(`\nLos datos de prueba quedaron con el sufijo ${RUN} (no se borran: turnos y reservas tienen FK).`);
}

main().catch((e) => {
  console.error('Error inesperado:', e);
  process.exit(1);
});