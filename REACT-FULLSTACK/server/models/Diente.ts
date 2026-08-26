import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface DienteAttributes {
  id: number;
  numero: number;
  nombre?: string | null;
  tipo: string;
}

export interface DienteCreationAttributes extends Optional<DienteAttributes, 'id' | 'nombre'> {}

export class Diente extends Model<DienteAttributes, DienteCreationAttributes> implements DienteAttributes {
  public id!: number;
  public numero!: number;
  public nombre!: string | null;
  public tipo!: string;

  public static associate(models: any) {
    Diente.belongsToMany(models.Cara, {
      through: models.DienteCara,
      foreignKey: 'diente_id',
      otherKey: 'cara_id',
      as: 'caras'
    });
    Diente.hasMany(models.Detalle, { foreignKey: 'diente_id', as: 'detalles' });
  }
}

export default (sequelize: Sequelize) => {
  Diente.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      numero: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        unique: true
      },
      nombre: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      tipo: {
        type: DataTypes.STRING(30),
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'diente',
      timestamps: false
    }
  );

  return Diente;
};
