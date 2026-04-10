import { DataTypes } from "sequelize";
import { sequelize } from "./sequelize.js";

export const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    type: {
      type: DataTypes.STRING(30), // new | cancelled | rescheduled | contact
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    data: {
      type: DataTypes.JSONB, // info extra (appointmentId, etc)
      allowNull: true,
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
  }
);