// src/config/sequelize.ts
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgress:admin123@localhost:5432/business_records',
  {
    dialect: 'postgres',
  }
);

export default sequelize;
