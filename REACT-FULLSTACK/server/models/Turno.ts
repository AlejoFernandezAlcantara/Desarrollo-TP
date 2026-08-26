import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface TurnoAttributes {
  codigo: number;
  fecha_hora_inicio: Date;
  duracion: number;
  estado?: string;
  odontologo_id: number;
  reserva_id?: number | null;
}

export interface TurnoCreationAttributes extends Optional<TurnoAttributes, 'codigo' | 'estado' | 'reserva_id'> {}

export class Turno extends Model<TurnoAttributes, TurnoCreationAttributes> implements TurnoAttributes {
  public codigo!: number;
  public fecha_hora_inicio!: Date;
  public duracion!: number;
  public estado!: string;
  public odontologo_id!: number;
  public reserva_id!: number | null;

  public static associate(models: any) {
    Turno.belongsTo(models.Odontologo, { foreignKey: 'odontologo_id', as: 'odontologo' });
    Turno.belongsTo(models.Reserva, { foreignKey: 'reserva_id', as: 'reserva' });
  }
}

export default (sequelize: Sequelize) => {
  Turno.init(
    {
      codigo: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      fecha_hora_inicio: {
        type: DataTypes.DATE,
        allowNull: false
      },
      duracion: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      estado: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'libre'
      },
      odontologo_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      reserva_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'turno',
      timestamps: false
    }
  );

  return Turno;
};
