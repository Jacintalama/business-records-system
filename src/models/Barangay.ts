import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '@/config/sequelize';

// Attributes for Barangay
export interface BarangayAttributes {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}


export type BarangayCreationAttributes = Optional<BarangayAttributes, 'id' | 'createdAt' | 'updatedAt'>

class Barangay extends Model<BarangayAttributes, BarangayCreationAttributes> implements BarangayAttributes {
  public id!: number;
  public name!: string;

  // timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Barangay.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Barangays',
    modelName: 'Barangay',
    timestamps: true,
  }
);

export default Barangay;
