import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface MutualAttributes {
  id: number;
  cuit: string;
  nombre: string;
}

export interface MutualCreationAttributes extends Optional<MutualAttributes, 'id'> {}

export class Mutual extends Model<MutualAttributes, MutualCreationAttributes> implements MutualAttributes {
  public id!: number;
  public cuit!: string;
  public nombre!: string;

  public static associate(models: any) {
    Mutual.hasMany(models.Reserva, { foreignKey: 'mutual_id', as: 'reservas' });
    Mutual.belongsToMany(models.Odontologo, {
      through: models.OdontologoMutual,
      foreignKey: 'mutual_id',
      otherKey: 'odontologo_id',
      as: 'odontologos'
    });
    Mutual.belongsToMany(models.Paciente, {
      through: models.PacienteMutual,
      foreignKey: 'mutual_id',
      otherKey: 'paciente_id',
      as: 'pacientes'
    });
  }
}

export default (sequelize: Sequelize) => {
  Mutual.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      cuit: {
        type: DataTypes.CHAR(11),
        allowNull: false,
        unique: true
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'mutual',
      timestamps: false
    }
  );

  return Mutual;
};
