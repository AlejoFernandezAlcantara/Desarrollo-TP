module.exports = (sequelize, DataTypes) => {
  const Reserva = sequelize.define('Reserva', {
    id_reserva: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    paciente_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    odontologo_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    mutual_id: {
      type: DataTypes.INTEGER.UNSIGNED
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada', 'realizada'),
      defaultValue: 'pendiente'
    },
    observaciones: {
      type: DataTypes.STRING(255)
    },
    coseguro: {
      type: DataTypes.DECIMAL(10, 2)
    },
    fechaRealizacion: {
      type: DataTypes.DATE
    },
    resultado: {
      type: DataTypes.ENUM('exitoso', 'requiere seguimiento', 'no asistió')
    }
  }, {
    tableName: 'reserva',
    timestamps: false
  });

  Reserva.associate = (db) => {
    Reserva.belongsTo(db.Paciente, { foreignKey: 'paciente_id' });
    Reserva.belongsTo(db.Odontologo, { foreignKey: 'odontologo_id' });
    Reserva.belongsTo(db.Mutual, { foreignKey: 'mutual_id' });
  };

  return Reserva;
};