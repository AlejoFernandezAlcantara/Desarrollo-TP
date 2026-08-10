module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    apellido: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    activo: {
      type: DataTypes.TINYINT,
      defaultValue: 1
    }
  }, {
    tableName: 'usuario',
    timestamps: false
  });

  Usuario.associate = (db) => {
    Usuario.hasOne(db.Paciente, { foreignKey: 'id' });
    Usuario.hasOne(db.Odontologo, { foreignKey: 'id' });
    Usuario.hasOne(db.Administrador, { foreignKey: 'id' });
  };

  return Usuario;
};