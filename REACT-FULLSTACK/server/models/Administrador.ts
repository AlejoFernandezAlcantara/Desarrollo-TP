import { Model, DataTypes, Sequelize } from 'sequelize';

export interface AdministradorAttributes {
  id: number;
}

export class Administrador extends Model<AdministradorAttributes> implements AdministradorAttributes {
  public id!: number;

  public static associate(models: any) {
    Administrador.belongsTo(models.Usuario, { foreignKey: 'id', as: 'usuario' });
  }
}

export default (sequelize: Sequelize) => {
  Administrador.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true
      }
    },
    {
      sequelize,
      tableName: 'administrador',
      timestamps: false
    }
  );

  return Administrador;
};
