import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface OdontogramaAttributes {
  id: number;
  fecha_creacion?: Date;
  estado?: string;
  paciente_id: number;
}

export interface OdontogramaCreationAttributes extends Optional<OdontogramaAttributes, 'id' | 'fecha_creacion' | 'estado'> {}

export class Odontograma extends Model<OdontogramaAttributes, OdontogramaCreationAttributes> implements OdontogramaAttributes {
  public id!: number;
  public fecha_creacion!: Date;
  public estado!: string;
  public paciente_id!: number;

  public static associate(models: any) {
    Odontograma.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    Odontograma.hasMany(models.Detalle, { foreignKey: 'odontograma_id', as: 'detalles' });
  }
}

export default (sequelize: Sequelize) => {
  Odontograma.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      estado: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'Activo'
      },
      paciente_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true
      }
    },
    {
      sequelize,
      tableName: 'odontograma',
      timestamps: false
    }
  );

  return Odontograma;
};
