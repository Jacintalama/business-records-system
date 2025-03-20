// src/models/Records.ts
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '@/config/sequelize'; // Adjust the path as needed

// Define the attributes for the Record model
interface RecordAttributes {
  id: number;
  year: number;
  date: Date;
  gross: number;
  orNo: string;
  busTax: number;
  mayorsPermit: number;
  sanitaryInps: number;
  policeClearance: number;
  taxClearance: number;
  garbage: number;
  verification: number;
  weightAndMass: number;
  healthClearance: number;
  secFee: number;
  menro: number;
  docTax: number;
  eggsFee: number;
  market: number;
  surcharge25: number;
  surcharge5: number;
  totalPayment: number;
  remarks?: string;
  businessId: number;
}

// Define creation attributes (id and remarks are optional on creation)
type RecordCreationAttributes = Optional<RecordAttributes, 'id' | 'remarks'>;

// Define the Record model class
class Record extends Model<RecordAttributes, RecordCreationAttributes> implements RecordAttributes {
  public id!: number;
  public year!: number;
  public date!: Date;
  public gross!: number;
  public orNo!: string;
  public busTax!: number;
  public mayorsPermit!: number;
  public sanitaryInps!: number;
  public policeClearance!: number;
  public taxClearance!: number;
  public garbage!: number;
  public verification!: number;
  public weightAndMass!: number;
  public healthClearance!: number;
  public secFee!: number;
  public menro!: number;
  public docTax!: number;
  public eggsFee!: number;
  public market!: number;
  public surcharge25!: number;
  public surcharge5!: number;
  public totalPayment!: number;
  public remarks?: string;
  public businessId!: number;

  // timestamps (automatically added by Sequelize if enabled)
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model with all fields
Record.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    gross: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    orNo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    busTax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    mayorsPermit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    sanitaryInps: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    policeClearance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    taxClearance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    garbage: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    verification: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    weightAndMass: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    healthClearance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    secFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    menro: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    docTax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    eggsFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    market: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    surcharge25: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    surcharge5: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalPayment: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    businessId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Records', // Ensure this matches your database table name
    modelName: 'Record',  // Model name (typically singular)
    timestamps: true,
  }
);

export default Record;
