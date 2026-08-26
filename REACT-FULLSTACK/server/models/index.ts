import { Sequelize } from 'sequelize';
import path from 'path';

import initUsuario, { Usuario } from './Usuario';
import initAdministrador, { Administrador } from './Administrador';
import initPaciente, { Paciente } from './Paciente';
import initOdontologo, { Odontologo } from './Odontologo';
import initMutual, { Mutual } from './Mutual';
import initOdontologoMutual, { OdontologoMutual } from './OdontologoMutual';
import initPacienteMutual, { PacienteMutual } from './PacienteMutual';
import initPractica, { Practica } from './Practica';
import initOdontograma, { Odontograma } from './Odontograma';
import initDiente, { Diente } from './Diente';
import initCara, { Cara } from './Cara';
import initDienteCara, { DienteCara } from './DienteCara';
import initReserva, { Reserva } from './Reserva';
import initTurno, { Turno } from './Turno';
import initDetalle, { Detalle } from './Detalle';
import initPosts, { Posts } from './Posts';

const env = process.env.NODE_ENV || 'development';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require(path.join(__dirname, '../config/config.js'))[env];

let sequelize: Sequelize;
if (config && config.use_env_variable && process.env[config.use_env_variable]) {
  sequelize = new Sequelize(process.env[config.use_env_variable] as string, config);
} else if (config) {
  sequelize = new Sequelize(
    config.database || 'consultorioBdd',
    config.username || 'root',
    config.password || '',
    {
      host: config.host || 'localhost',
      dialect: config.dialect || 'mysql',
      logging: config.logging ?? false,
      ...config
    }
  );
} else {
  sequelize = new Sequelize('mysql://root@localhost:3306/consultorioBdd');
}

// Inicializar todos los modelos
initUsuario(sequelize);
initAdministrador(sequelize);
initPaciente(sequelize);
initOdontologo(sequelize);
initMutual(sequelize);
initOdontologoMutual(sequelize);
initPacienteMutual(sequelize);
initPractica(sequelize);
initOdontograma(sequelize);
initDiente(sequelize);
initCara(sequelize);
initDienteCara(sequelize);
initReserva(sequelize);
initTurno(sequelize);
initDetalle(sequelize);
initPosts(sequelize);

export interface DBInterface {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
  Usuario: typeof Usuario;
  Administrador: typeof Administrador;
  Paciente: typeof Paciente;
  Odontologo: typeof Odontologo;
  Mutual: typeof Mutual;
  OdontologoMutual: typeof OdontologoMutual;
  PacienteMutual: typeof PacienteMutual;
  Practica: typeof Practica;
  Odontograma: typeof Odontograma;
  Diente: typeof Diente;
  Cara: typeof Cara;
  DienteCara: typeof DienteCara;
  Reserva: typeof Reserva;
  Turno: typeof Turno;
  Detalle: typeof Detalle;
  Posts: typeof Posts;
  [key: string]: any;
}

export const db: DBInterface = {
  sequelize,
  Sequelize,
  Usuario,
  Administrador,
  Paciente,
  Odontologo,
  Mutual,
  OdontologoMutual,
  PacienteMutual,
  Practica,
  Odontograma,
  Diente,
  Cara,
  DienteCara,
  Reserva,
  Turno,
  Detalle,
  Posts
};

// Ejecutar asociaciones en el orden correcto
Object.keys(db).forEach((modelName) => {
  if (db[modelName] && typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

// Re-exportar tipos y clases individuales para importación directa
export {
  Usuario,
  Administrador,
  Paciente,
  Odontologo,
  Mutual,
  OdontologoMutual,
  PacienteMutual,
  Practica,
  Odontograma,
  Diente,
  Cara,
  DienteCara,
  Reserva,
  Turno,
  Detalle,
  Posts
};

export default db;
module.exports = db;
