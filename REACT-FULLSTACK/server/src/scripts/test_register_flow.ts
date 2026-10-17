import prisma from '../lib/prisma';

async function testFullPatientAuth() {
  console.log('--- TEST 1: Register Paciente API ---');
  const testEmail = `paciente_unit_test_${Date.now()}@dentalcare.com`;
  const registerPayload = {
    nombre: 'Carlos',
    apellido: 'González',
    email: testEmail,
    password: 'Password123!',
    tipoDoc: 'DNI',
    nroDocumento: '38123456',
    direccion: 'Av. Corrientes 1234, CABA',
    telefono: '1155443322'
  };

  const regResponse = await fetch('http://localhost:3001/api/auth/register/paciente', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload)
  });

  const regData = await regResponse.json();
  console.log('Status registro:', regResponse.status);
  console.log('Respuesta registro:', regData);

  if (regResponse.status !== 201) {
    throw new Error('Fallo el registro: ' + JSON.stringify(regData));
  }

  // Extraer cookie
  const setCookie = regResponse.headers.get('set-cookie');
  console.log('Set-Cookie recibido en registro:', setCookie ? 'SI (HttpOnly)' : 'NO');

  console.log('\n--- TEST 2: Intentar registrar con mismo email (debe fallar) ---');
  const dupResponse = await fetch('http://localhost:3001/api/auth/register/paciente', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload)
  });
  const dupData = await dupResponse.json();
  console.log('Status duplicado:', dupResponse.status);
  console.log('Mensaje duplicado:', dupData.error);

  console.log('\n--- TEST 3: Login con las credenciales recién registradas ---');
  const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Password123!'
    })
  });
  const loginData = await loginResponse.json();
  console.log('Status login:', loginResponse.status);
  console.log('Usuario autenticado:', loginData.usuario);

  console.log('\n--- TEST 4: Verificar en base de datos MySQL directa ---');
  const dbUser = await prisma.usuario.findUnique({
    where: { email: testEmail },
    include: { paciente: true }
  });
  console.log('Usuario en BD:', {
    id: dbUser?.id,
    nombre: dbUser?.nombre,
    apellido: dbUser?.apellido,
    email: dbUser?.email,
    pacienteId: dbUser?.paciente?.id,
    nro_paciente: dbUser?.paciente?.nro_paciente,
    direccion: dbUser?.paciente?.direccion,
    nroDocumento: dbUser?.paciente?.nroDocumento,
    tipoDoc: dbUser?.paciente?.tipoDoc
  });

  // Limpieza
  console.log('\n--- TEST 5: Limpieza de paciente de prueba ---');
  await prisma.usuario.delete({ where: { email: testEmail } });
  console.log('Usuario de prueba eliminado con éxito');
}

testFullPatientAuth()
  .then(() => {
    console.log('\n✅ TODOS LOS TESTS COMPLETADOS SATISFACTORIAMENTE');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ ERROR EN TEST:', err);
    process.exit(1);
  });
