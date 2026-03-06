import { sequelize } from "./sequelize.js";

import { User } from "./user.model.js";
import { Business } from "./business.model.js";
import { Staff } from "./staff.model.js";
import { Service } from "./service.model.js";
import { Client } from "./client.model.js";
import { Appointment } from "./appointment.model.js";
import { Income } from "./income.model.js";
import { Block } from "./block.model.js";
import { RecurringBlock } from "./recurringBlock.model.js";
import { SpecialDay } from "./specialDay.model.js";
import { ServiceStaff } from "./serviceStaff.model.js";

/* =========================
   RELACIONES
========================= */

// Business
Business.hasMany(Staff, { foreignKey: "businessId", as: "staff" });
Staff.belongsTo(Business, { foreignKey: "businessId", as: "business" });

Business.hasMany(Service, { foreignKey: "businessId", as: "services" });
Service.belongsTo(Business, { foreignKey: "businessId", as: "business" });

Business.hasMany(Client, { foreignKey: "businessId", as: "clients" });
Client.belongsTo(Business, { foreignKey: "businessId", as: "business" });

Business.hasMany(Appointment, { foreignKey: "businessId", as: "appointments" });
Appointment.belongsTo(Business, { foreignKey: "businessId", as: "business" });

Business.hasMany(Income, { foreignKey: "businessId", as: "incomes" });
Income.belongsTo(Business, { foreignKey: "businessId", as: "business" });

Business.hasMany(Block, { foreignKey: "businessId", as: "blocks" });
Block.belongsTo(Business, { foreignKey: "businessId", as: "business" });

Business.hasMany(RecurringBlock, { foreignKey: "businessId", as: "recurringBlocks" });
RecurringBlock.belongsTo(Business, { foreignKey: "businessId", as: "business" });

Business.hasMany(SpecialDay, { foreignKey: "businessId", as: "specialDays" });
SpecialDay.belongsTo(Business, { foreignKey: "businessId", as: "business" });

// Service <-> Staff
Service.belongsToMany(Staff, {
  through: ServiceStaff,
  foreignKey: "serviceId",
  otherKey: "staffId",
  as: "allowedStaff",
});

Staff.belongsToMany(Service, {
  through: ServiceStaff,
  foreignKey: "staffId",
  otherKey: "serviceId",
  as: "allowedServices",
});

// Appointment
Appointment.belongsTo(Client, { foreignKey: "clientId", as: "client" });
Client.hasMany(Appointment, { foreignKey: "clientId", as: "appointments" });

Appointment.belongsTo(Service, { foreignKey: "serviceId", as: "service" });
Service.hasMany(Appointment, { foreignKey: "serviceId", as: "appointments" });

Appointment.belongsTo(Staff, { foreignKey: "staffId", as: "staff" });
Staff.hasMany(Appointment, { foreignKey: "staffId", as: "appointments" });

// Income
Income.belongsTo(Appointment, { foreignKey: "appointmentId", as: "appointment" });
Appointment.hasOne(Income, { foreignKey: "appointmentId", as: "income" });

Income.belongsTo(Service, { foreignKey: "serviceId", as: "service" });
Service.hasMany(Income, { foreignKey: "serviceId", as: "incomes" });

// Block
Block.belongsTo(Staff, { foreignKey: "staffId", as: "staff" });
Staff.hasMany(Block, { foreignKey: "staffId", as: "blocks" });

// RecurringBlock
RecurringBlock.belongsTo(Staff, { foreignKey: "staffId", as: "staff" });
Staff.hasMany(RecurringBlock, { foreignKey: "staffId", as: "recurringBlocks" });

/* =========================
   HELPERS
========================= */

export async function testDatabaseConnection() {
  await sequelize.authenticate();
  console.log("✅ Conexión a PostgreSQL OK");
}

export {
  sequelize,
  User,
  Business,
  Staff,
  Service,
  Client,
  Appointment,
  Income,
  Block,
  RecurringBlock,
  SpecialDay,
  ServiceStaff,
};