import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface PostsAttributes {
  id?: number;
  title: string;
  postsText: string;
  username: string;
}

export interface PostsCreationAttributes extends Optional<PostsAttributes, 'id'> {}

export class Posts extends Model<PostsAttributes, PostsCreationAttributes> implements PostsAttributes {
  public id!: number;
  public title!: string;
  public postsText!: string;
  public username!: string;

  public static associate(_models: any) {
    // Asociaciones futuras si aplica
  }
}

export default (sequelize: Sequelize) => {
  Posts.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      postsText: {
        type: DataTypes.STRING,
        allowNull: false
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'posts',
      timestamps: true
    }
  );

  return Posts;
};
