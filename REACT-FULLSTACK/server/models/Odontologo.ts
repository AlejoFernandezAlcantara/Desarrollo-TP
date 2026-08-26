import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export type TipoDocumento = 'DNI' | 'Pasaporte';

export interface OdontologoAttributes {
  id: number;
  nro_Matricula: number;
  especialidad: string;
  telefono?: string | null;
  nroDocumento: string;
  tipoDoc: TipoDocumento;
}

export interface OdontologoCreationAttributes extends Optional<OdontologoAttributes, 'telefono'> {}

export class Odontologo extends Model<OdontologoAttributes, OdontologoCreationAttributes> implements OdontologoAttributes {
  public id!: number;
  public nro_Matricula!: number;
  public especialidad!: string;
  public telefono!: string | null;
  public nroDocumento!: string;
  public tipoDoc!: TipoDocumento;

  public static associate(models: any) {
    Odontologo.belongsTo(models.Usuario, { foreignKey: 'id', as: 'usuario' });
    Odontologo.hasMany(models.Reserva, { foreignKey: 'odontologo_id', as: 'reservas' });
    Odontologo.hasMany(models.Turno, { foreignKey: 'odontologo_id', as: 'turnos' });
    Odontologo.belongsToMany(models.Mutual, {
      through: models.OdontologoMutual,
      foreignKey: 'odontologo_id',
      otherKey: 'mutual_id',
      as: 'mutuales'
    });
  }
}

export default (sequelize: Sequelize) => {
  Odontologo.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true
      },
      nro_Matricula: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true
      },
      especialidad: {
        type: DataTypes.STRING(50),
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
      tableName: 'odontologo',
      timestamps: false
    }
  );

  return Odontologo;
};
