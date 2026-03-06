import { DataTypes } from "sequelize";
import { sequelize } from "./sequelize.js";

export const Appointment = sequelize.define(
  "Appointment",
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

    clientId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "client_id",
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

    clientName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: "client_name",
    },

    clientPhone: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "client_phone",
    },

    clientEmail: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: "client_email",
    },

    serviceName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: "service_name",
    },

    staffName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: "staff_name",
    },

    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    startAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "start_at",
    },

    endAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "end_at",
    },

    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "confirmed",
    },

    channel: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "web",
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    allowOverlap: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "allow_overlap",
    },
  },
  {
    tableName: "appointments",
    underscored: true,
    timestamps: true,
  }
);