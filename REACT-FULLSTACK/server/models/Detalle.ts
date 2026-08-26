import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface DetalleAttributes {
  id: number;
  fecha_realizacion?: Date;
  observaciones?: string | null;
  odontograma_id: number;
  practica_id: number;
  diente_id?: number | null;
  reserva_id: number;
}

export interface DetalleCreationAttributes extends Optional<DetalleAttributes, 'id' | 'fecha_realizacion' | 'observaciones' | 'diente_id'> {}

export class Detalle extends Model<DetalleAttributes, DetalleCreationAttributes> implements DetalleAttributes {
  public id!: number;
  public fecha_realizacion!: Date;
  public observaciones!: string | null;
  public odontograma_id!: number;
  public practica_id!: number;
  public diente_id!: number | null;
  public reserva_id!: number;

  public static associate(models: any) {
    Detalle.belongsTo(models.Odontograma, { foreignKey: 'odontograma_id', as: 'odontograma' });
    Detalle.belongsTo(models.Practica, { foreignKey: 'practica_id', as: 'practica' });
    Detalle.belongsTo(models.Diente, { foreignKey: 'diente_id', as: 'diente' });
    Detalle.belongsTo(models.Reserva, { foreignKey: 'reserva_id', as: 'reserva' });
  }
}

export default (sequelize: Sequelize) => {
  Detalle.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      fecha_realizacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      odontograma_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      practica_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      diente_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      reserva_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'detalle',
      timestamps: false
    }
  );

  return Detalle;
};
