import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface UsuarioAttributes {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  password_hash: string;
  activo?: number;
}

export interface UsuarioCreationAttributes extends Optional<UsuarioAttributes, 'id' | 'activo'> {}

export class Usuario extends Model<UsuarioAttributes, UsuarioCreationAttributes> implements UsuarioAttributes {
  public id!: number;
  public nombre!: string;
  public apellido!: string;
  public email!: string;
  public password_hash!: string;
  public activo!: number;

  public static associate(models: any) {
    Usuario.hasOne(models.Paciente, { foreignKey: 'id', as: 'paciente' });
    Usuario.hasOne(models.Odontologo, { foreignKey: 'id', as: 'odontologo' });
    Usuario.hasOne(models.Administrador, { foreignKey: 'id', as: 'administrador' });
  }
}

export default (sequelize: Sequelize) => {
  Usuario.init(
    {
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
    },
    {
      sequelize,
      tableName: 'usuario',
      timestamps: false
    }
  );

  return Usuario;
};
