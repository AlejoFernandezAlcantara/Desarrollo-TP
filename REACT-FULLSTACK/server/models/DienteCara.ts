import { Model, DataTypes, Sequelize } from 'sequelize';

export interface DienteCaraAttributes {
  diente_id: number;
  cara_id: number;
}

export class DienteCara extends Model<DienteCaraAttributes> implements DienteCaraAttributes {
  public diente_id!: number;
  public cara_id!: number;

  public static associate(models: any) {
    DienteCara.belongsTo(models.Diente, { foreignKey: 'diente_id' });
    DienteCara.belongsTo(models.Cara, { foreignKey: 'cara_id' });
  }
}

export default (sequelize: Sequelize) => {
  DienteCara.init(
    {
      diente_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        allowNull: false
      },
      cara_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'diente_cara',
      timestamps: false
    }
  );

  return DienteCara;
};
