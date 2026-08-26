import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export type TipoDocumento = 'DNI' | 'Pasaporte';

export interface PacienteAttributes {
  id: number;
  nro_paciente: number;
  direccion: string;
  telefono?: string | null;
  nroDocumento: string;
  tipoDoc: TipoDocumento;
}

export interface PacienteCreationAttributes extends Optional<PacienteAttributes, 'telefono'> {}

export class Paciente extends Model<PacienteAttributes, PacienteCreationAttributes> implements PacienteAttributes {
  public id!: number;
  public nro_paciente!: number;
  public direccion!: string;
  public telefono!: string | null;
  public nroDocumento!: string;
  public tipoDoc!: TipoDocumento;

  public static associate(models: any) {
    Paciente.belongsTo(models.Usuario, { foreignKey: 'id', as: 'usuario' });
    Paciente.hasMany(models.Reserva, { foreignKey: 'paciente_id', as: 'reservas' });
    Paciente.hasOne(models.Odontograma, { foreignKey: 'paciente_id', as: 'odontograma' });
    Paciente.belongsToMany(models.Mutual, {
      through: models.PacienteMutual,
      foreignKey: 'paciente_id',
      otherKey: 'mutual_id',
      as: 'mutuales'
    });
  }
}

export default (sequelize: Sequelize) => {
  Paciente.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true
      },
      nro_paciente: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true
      },
      direccion: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      telefono: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      nroDocumento: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      tipoDoc: {
        type: DataTypes.ENUM('DNI', 'Pasaporte'),
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'paciente',
      timestamps: false
    }
  );

  return Paciente;
};
