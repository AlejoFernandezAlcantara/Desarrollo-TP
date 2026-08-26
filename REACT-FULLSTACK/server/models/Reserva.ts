import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada' | 'realizada';
export type ResultadoReserva = 'exitoso' | 'requiere seguimiento' | 'no asistió';

export interface ReservaAttributes {
  id_reserva: number;
  paciente_id: number;
  odontologo_id: number;
  mutual_id?: number | null;
  fecha_creacion?: Date;
  estado?: EstadoReserva;
  observaciones?: string | null;
  coseguro?: number | null;
  fechaRealizacion?: Date | null;
  resultado?: ResultadoReserva | null;
}

export interface ReservaCreationAttributes extends Optional<ReservaAttributes, 'id_reserva' | 'mutual_id' | 'fecha_creacion' | 'estado' | 'observaciones' | 'coseguro' | 'fechaRealizacion' | 'resultado'> {}

export class Reserva extends Model<ReservaAttributes, ReservaCreationAttributes> implements ReservaAttributes {
  public id_reserva!: number;
  public paciente_id!: number;
  public odontologo_id!: number;
  public mutual_id!: number | null;
  public fecha_creacion!: Date;
  public estado!: EstadoReserva;
  public observaciones!: string | null;
  public coseguro!: number | null;
  public fechaRealizacion!: Date | null;
  public resultado!: ResultadoReserva | null;

  public static associate(models: any) {
    Reserva.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    Reserva.belongsTo(models.Odontologo, { foreignKey: 'odontologo_id', as: 'odontologo' });
    Reserva.belongsTo(models.Mutual, { foreignKey: 'mutual_id', as: 'mutual' });
    Reserva.hasMany(models.Turno, { foreignKey: 'reserva_id', as: 'turnos' });
    Reserva.hasMany(models.Detalle, { foreignKey: 'reserva_id', as: 'detalles' });
  }
}

export default (sequelize: Sequelize) => {
  Reserva.init(
    {
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
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      estado: {
        type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada', 'realizada'),
        defaultValue: 'pendiente',
        allowNull: false
      },
      observaciones: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      coseguro: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      fechaRealizacion: {
        type: DataTypes.DATE,
        allowNull: true
      },
      resultado: {
        type: DataTypes.ENUM('exitoso', 'requiere seguimiento', 'no asistió'),
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'reserva',
      timestamps: false
    }
  );

  return Reserva;
};
