import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Iniciando carga de usuarios y credenciales en la base de datos...');

  const adminPass = await bcrypt.hash('Admin123!', 10);
  const odontoPass = await bcrypt.hash('Odonto123!', 10);
  const pacientePass = await bcrypt.hash('Paciente123!', 10);

  // 1. Administrador: admin@consultorio.com / Admin123!
  let adminUser = await prisma.usuario.findUnique({
    where: { email: 'admin@consultorio.com' },
    include: { administrador: true }
  });

  if (!adminUser) {
    adminUser = await prisma.usuario.create({
      data: {
        nombre: 'Admin',
        apellido: 'Sistema',
        email: 'admin@consultorio.com',
        password_hash: adminPass,
        activo: 1,
        administrador: {
          create: {}
        }
      },
      include: { administrador: true }
    });
    console.log('✅ Usuario Administrador creado: admin@consultorio.com / Admin123!');
  } else {
    await prisma.usuario.update({
      where: { id: adminUser.id },
      data: {
        password_hash: adminPass,
        activo: 1
      }
    });
    if (!adminUser.administrador) {
      await prisma.administrador.create({ data: { id: adminUser.id } });
    }
    console.log('✅ Usuario Administrador actualizado: admin@consultorio.com / Admin123!');
  }

  // 2. Odontólogo: odonto@consultorio.com / Odonto123!
  let odontoUser = await prisma.usuario.findUnique({
    where: { email: 'odonto@consultorio.com' },
    include: { odontologo: true }
  });

  if (!odontoUser) {
    const allOdontos = await prisma.odontologo.findMany({ select: { nro_Matricula: true } });
    const maxMatricula = allOdontos.reduce((max, o) => Math.max(max, o.nro_Matricula), 45890);

    odontoUser = await prisma.usuario.create({
      data: {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'odonto@consultorio.com',
        password_hash: odontoPass,
        activo: 1,
        odontologo: {
          create: {
            nro_Matricula: maxMatricula + 1,
            especialidad: 'Ortodoncia',
            telefono: '1145678901',
            nroDocumento: '30111222',
            tipoDoc: 'DNI'
          }
        }
      },
      include: { odontologo: true }
    });
    console.log('✅ Usuario Odontólogo creado: odonto@consultorio.com / Odonto123!');
  } else {
    await prisma.usuario.update({
      where: { id: odontoUser.id },
      data: {
        password_hash: odontoPass,
        activo: 1
      }
    });
    console.log('✅ Usuario Odontólogo actualizado: odonto@consultorio.com / Odonto123!');
  }

  // 3. Paciente: paciente@consultorio.com / Paciente123!
  let pacienteUser = await prisma.usuario.findUnique({
    where: { email: 'paciente@consultorio.com' },
    include: { paciente: true }
  });

  if (!pacienteUser) {
    const allPacientes = await prisma.paciente.findMany({ select: { nro_paciente: true } });
    const maxNroPaciente = allPacientes.reduce((max, p) => Math.max(max, p.nro_paciente), 1000);

    pacienteUser = await prisma.usuario.create({
      data: {
        nombre: 'María',
        apellido: 'Gómez',
        email: 'paciente@consultorio.com',
        password_hash: pacientePass,
        activo: 1,
        paciente: {
          create: {
            nro_paciente: maxNroPaciente + 1,
            direccion: 'Av. Corrientes 1234',
            telefono: '1198765432',
            nroDocumento: '35999888',
            tipoDoc: 'DNI'
          }
        }
      },
      include: { paciente: true }
    });
    console.log('✅ Usuario Paciente creado: paciente@consultorio.com / Paciente123!');
  } else {
    await prisma.usuario.update({
      where: { id: pacienteUser.id },
      data: {
        password_hash: pacientePass,
        activo: 1
      }
    });
    console.log('✅ Usuario Paciente actualizado: paciente@consultorio.com / Paciente123!');
  }

  // 4. Actualizar contraseñas con texto plano 'hash_temporal_123' para que no fallen
  const tempoUsers = await prisma.usuario.findMany({
    where: { password_hash: { startsWith: 'hash_temp' } }
  });
  for (const u of tempoUsers) {
    await prisma.usuario.update({
      where: { id: u.id },
      data: { password_hash: odontoPass }
    });
    console.log(`ℹ️ Contraseña de ${u.email} actualizada a 'Odonto123!'`);
  }

  console.log('🎉 Base de datos sembrada y actualizada exitosamente.');
}

seed()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
