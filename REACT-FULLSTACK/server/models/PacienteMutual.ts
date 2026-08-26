import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface PacienteMutualAttributes {
  paciente_id: number;
  mutual_id: number;
  nroAfiliado: string;
  cubre?: number;
}

export interface PacienteMutualCreationAttributes extends Optional<PacienteMutualAttributes, 'cubre'> {}

export class PacienteMutual extends Model<PacienteMutualAttributes, PacienteMutualCreationAttributes> implements PacienteMutualAttributes {
  public paciente_id!: number;
  public mutual_id!: number;
  public nroAfiliado!: string;
  public cubre!: number;

  public static associate(models: any) {
    PacienteMutual.belongsTo(models.Paciente, { foreignKey: 'paciente_id' });
    PacienteMutual.belongsTo(models.Mutual, { foreignKey: 'mutual_id' });
  }
}

export default (sequelize: Sequelize) => {
  PacienteMutual.init(
    {
      paciente_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        allowNull: false
      },
      mutual_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        allowNull: false
      },
      nroAfiliado: {
        type: DataTypes.STRING(30),
        allowNull: false
      },
      cubre: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      sequelize,
      tableName: 'paciente_mutual',
      timestamps: false
    }
  );

  return PacienteMutual;
};
