import { DataTypes } from "sequelize";
import { sequelize } from "./sequelize.js";

export const Staff = sequelize.define(
  "Staff",
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

    firstName: {
      type: DataTypes.STRING(60),
      allowNull: true,
      field: "first_name",
    },

    lastName: {
      type: DataTypes.STRING(60),
      allowNull: true,
      field: "last_name",
    },

    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    dni: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    photoUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "photo_url",
    },

    skillsJson: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: "skills_json",
    },

    scheduleOverrideJson: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "schedule_override_json",
    },

    isOwner: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_owner",
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active",
    },
  },
  {
    tableName: "staff",
    underscored: true,
    timestamps: true,
  }
);