import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '@/config/sequelize';

export interface BusinessAttributes {
  id: number;
  applicantName: string;
  applicantAddress: string;
  businessName: string;
  capitalInvestment: number;
  barangayId: number;
  createdAt?: Date;
  updatedAt?: Date;
}


export type BusinessCreationAttributes = Optional<BusinessAttributes, 'id' | 'createdAt' | 'updatedAt'>

class Business extends Model<BusinessAttributes, BusinessCreationAttributes> implements BusinessAttributes {
  public id!: number;
  public applicantName!: string;
  public applicantAddress!: string;
  public businessName!: string;
  public capitalInvestment!: number;
  public barangayId!: number;

  // timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Business.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    applicantName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    applicantAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    capitalInvestment: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    barangayId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Businesses',
    modelName: 'Business',
    timestamps: true,
  }
);

export default Business;
