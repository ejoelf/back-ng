import { DataTypes } from "sequelize";
import { sequelize } from "./sequelize.js";

export const SpecialDay = sequelize.define(
  "SpecialDay",
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

    dateStr: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "date_str",
    },

    open: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    intervalsJson: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: "intervals_json",
    },
  },
  {
    tableName: "special_days",
    underscored: true,
    timestamps: true,
  }
);