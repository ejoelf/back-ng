import { DataTypes } from "sequelize";
import { sequelize } from "./sequelize.js";

export const ServiceStaff = sequelize.define(
  "ServiceStaff",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },

    serviceId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "service_id",
    },

    staffId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "staff_id",
    },
  },
  {
    tableName: "service_staff",
    underscored: true,
    timestamps: true,
  }
);