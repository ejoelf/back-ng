import { DataTypes } from "sequelize";
import { sequelize } from "./sequelize.js";

export const Business = sequelize.define(
  "Business",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    whatsapp: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    logoUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "logo_url",
    },

    heroImageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "hero_image_url",
    },

    scheduleJson: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: "schedule_json",
      defaultValue: {
        openDays: [2, 3, 4, 5, 6],
        intervals: [
          { start: "09:00", end: "12:30" },
          { start: "16:00", end: "20:30" },
        ],
        stepMinutes: 30,
        bufferMin: 0,
      },
    },
  },
  {
    tableName: "businesses",
    underscored: true,
    timestamps: true,
  }
);