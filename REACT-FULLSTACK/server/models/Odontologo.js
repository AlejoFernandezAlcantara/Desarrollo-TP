module.exports = (sequelize, DataTypes) => {
  const Odontologo = sequelize.define('Odontologo', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true
    },
    nro_Matricula: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true
    },
    especialidad: {
      type: DataTypes.STRING(50),
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
    tableName: 'odontologo',
    timestamps: false
  });

  Odontologo.associate = (db) => {
    Odontologo.belongsTo(db.Usuario, { foreignKey: 'id' });
    Odontologo.hasMany(db.Reserva, { foreignKey: 'odontologo_id' });
    Odontologo.hasMany(db.Turno, { foreignKey: 'odontologo_id' });
  };

  return Odontologo;
};