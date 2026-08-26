import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface PracticaAttributes {
  id: number;
  codigo: string;
  detalle: string;
  precio: number;
}

export interface PracticaCreationAttributes extends Optional<PracticaAttributes, 'id'> {}

export class Practica extends Model<PracticaAttributes, PracticaCreationAttributes> implements PracticaAttributes {
  public id!: number;
  public codigo!: string;
  public detalle!: string;
  public precio!: number;

  public static associate(models: any) {
    Practica.hasMany(models.Detalle, { foreignKey: 'practica_id', as: 'detalles' });
  }
}

export default (sequelize: Sequelize) => {
  Practica.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      codigo: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
      },
      detalle: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'practica',
      timestamps: false
    }
  );

  return Practica;
};
