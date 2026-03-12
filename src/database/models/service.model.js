import { DataTypes } from "sequelize";
import { sequelize } from "./sequelize.js";

export const Service = sequelize.define(
  "Service",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },

    businessId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "business_id",
    },

    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    durationMin: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      field: "duration_min",
    },

    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "image_url",
    },

    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "display_order",
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active",
    },
  },
  {
    tableName: "services",
    underscored: true,
    timestamps: true,
  }
);
