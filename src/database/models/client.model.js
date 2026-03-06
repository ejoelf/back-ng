import { DataTypes } from "sequelize";
import { sequelize } from "./sequelize.js";

export const Client = sequelize.define(
  "Client",
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

    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    phone: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    tagsJson: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: "tags_json",
    },

    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_deleted",
    },

    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at",
    },
  },
  {
    tableName: "clients",
    underscored: true,
    timestamps: true,
  }
);