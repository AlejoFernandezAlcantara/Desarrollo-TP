import { Model, DataTypes, Sequelize } from 'sequelize';

export interface OdontologoMutualAttributes {
  odontologo_id: number;
  mutual_id: number;
  nroAfiliado: string;
}

export class OdontologoMutual extends Model<OdontologoMutualAttributes> implements OdontologoMutualAttributes {
  public odontologo_id!: number;
  public mutual_id!: number;
  public nroAfiliado!: string;

  public static associate(models: any) {
    OdontologoMutual.belongsTo(models.Odontologo, { foreignKey: 'odontologo_id' });
    OdontologoMutual.belongsTo(models.Mutual, { foreignKey: 'mutual_id' });
  }
}

export default (sequelize: Sequelize) => {
  OdontologoMutual.init(
    {
      odontologo_id: {
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
      }
    },
    {
      sequelize,
      tableName: 'odontologo_mutual',
      timestamps: false
    }
  );

  return OdontologoMutual;
};
