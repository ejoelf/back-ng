import { DataTypes } from "sequelize";
import { sequelize } from "./sequelize.js";

export const RecurringBlock = sequelize.define(
  "RecurringBlock",
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

    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "day_of_week",
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
    tableName: "recurring_blocks",
    underscored: true,
    timestamps: true,
  }
);