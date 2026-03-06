import "dotenv/config";
import { Sequelize } from "sequelize";

const isProduction = process.env.NODE_ENV === "production";

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 5432),
    dialect: "postgres",
    logging: false,
    timezone: "-03:00",
    dialectOptions: isProduction ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
  }
);