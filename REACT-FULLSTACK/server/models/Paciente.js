module.exports = (sequelize, DataTypes) => {
  const Paciente = sequelize.define('Paciente', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true
    },
    nro_paciente: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true
    },
    direccion: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    telefono: {
      type: DataTypes.STRING(20)
    },
    nroDocumento: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    tipoDoc: {
      type: DataTypes.ENUM('DNI', 'Pasaporte'),
      allowNull: false
    }
  }, {
    tableName: 'paciente',
    timestamps: false
  });

  Paciente.associate = (db) => {
    Paciente.belongsTo(db.Usuario, { foreignKey: 'id' });
    Paciente.hasMany(db.Reserva, { foreignKey: 'paciente_id' });
  };

  return Paciente;
};