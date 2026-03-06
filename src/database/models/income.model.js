import { DataTypes } from "sequelize";
import { sequelize } from "./sequelize.js";

export const Income = sequelize.define(
  "Income",
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

    appointmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "appointment_id",
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    serviceId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "service_id",
    },

    serviceName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: "service_name",
    },

    clientName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: "client_name",
    },

    amountEstimated: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "amount_estimated",
    },

    amountFinal: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "amount_final",
    },

    paymentMethod: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: "payment_method",
    },

    paidStatus: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "pending",
      field: "paid_status",
    },

    detail: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "paid_at",
    },
  },
  {
    tableName: "incomes",
    underscored: true,
    timestamps: true,
  }
);