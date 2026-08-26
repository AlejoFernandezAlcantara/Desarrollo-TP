import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface CaraAttributes {
  id: number;
  nombre: string;
  detalle?: string | null;
}

export interface CaraCreationAttributes extends Optional<CaraAttributes, 'id' | 'detalle'> {}

export class Cara extends Model<CaraAttributes, CaraCreationAttributes> implements CaraAttributes {
  public id!: number;
  public nombre!: string;
  public detalle!: string | null;

  public static associate(models: any) {
    Cara.belongsToMany(models.Diente, {
      through: models.DienteCara,
      foreignKey: 'cara_id',
      otherKey: 'diente_id',
      as: 'dientes'
    });
  }
}

export default (sequelize: Sequelize) => {
  Cara.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      nombre: {
        type: DataTypes.STRING(30),
        allowNull: false
      },
      detalle: {
        type: DataTypes.STRING(100),
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'cara',
      timestamps: false
    }
  );

  return Cara;
};
