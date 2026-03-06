import { Business, Service, Staff } from "../../database/models/index.js";

function parseJsonField(value, fallback) {
  if (value == null) return fallback;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return value;
}

function mapBusiness(business) {
  if (!business) return null;

  return {
    id: business.id,
    name: business.name,
    address: business.address,
    whatsapp: business.whatsapp,
    brand: {
      logoUrl: business.logoUrl || "",
      heroImageUrl: business.heroImageUrl || "",
    },
    schedule: parseJsonField(business.scheduleJson, {
      openDays: [2, 3, 4, 5, 6],
      intervals: [
        { start: "09:00", end: "12:30" },
        { start: "16:00", end: "20:30" },
      ],
      stepMinutes: 30,
      bufferMin: 0,
    }),
  };
}

function mapService(service) {
  return {
    id: service.id,
    code: service.code,
    name: service.name,
    durationMin: service.durationMin,
    price: service.price,
    imageUrl: service.imageUrl || "",
    allowedStaffIds: Array.isArray(service.allowedStaff)
      ? service.allowedStaff.map((staff) => staff.id)
      : [],
  };
}

function mapStaff(staff) {
  return {
    id: staff.id,
    name: staff.name,
    firstName: staff.firstName || "",
    lastName: staff.lastName || "",
    bio: staff.bio || "",
    photoUrl: staff.photoUrl || "",
    isOwner: Boolean(staff.isOwner),
    skills: parseJsonField(staff.skillsJson, []),
    scheduleOverride: parseJsonField(staff.scheduleOverrideJson, null),
    isActive: Boolean(staff.isActive),
  };
}

export async function getPublicBusiness() {
  const business = await Business.findOne({
    order: [["createdAt", "ASC"]],
  });

  return mapBusiness(business);
}

export async function getPublicServices() {
  const services = await Service.findAll({
    where: { isActive: true },
    include: [
      {
        model: Staff,
        as: "allowedStaff",
        attributes: ["id"],
        through: { attributes: [] },
      },
    ],
    order: [["createdAt", "ASC"]],
  });

  return services.map(mapService);
}

export async function getPublicStaff() {
  const staff = await Staff.findAll({
    where: { isActive: true },
    order: [
      ["isOwner", "DESC"],
      ["createdAt", "ASC"],
    ],
  });

  return staff.map(mapStaff);
}