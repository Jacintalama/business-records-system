// src/models/User.ts
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize'; 

export class User extends Model {
  public id!: number;
  public username!: string;
  public password!: string;
}

User.init({
  username: DataTypes.STRING,
  password: DataTypes.STRING
}, {
  sequelize,
  modelName: 'User',
});
