import { DataTypes } from "sequelize";
import { sequelize } from "./sequelize.js";

export const Block = sequelize.define(
  "Block",
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

    staffId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "staff_id",
    },

    dateStr: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "date_str",
    },

    start: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },

    end: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },

    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "blocks",
    underscored: true,
    timestamps: true,
  }
);