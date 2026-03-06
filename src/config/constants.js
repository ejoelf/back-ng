export const APPOINTMENT_STATUS = {
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  RESCHEDULED: "rescheduled",
  NO_SHOW: "no-show",
  COMPLETED: "completed",
};

export const INCOME_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  VOID: "void",
  UNPAID: "unpaid",
};

export const PAYMENT_METHOD = {
  CASH: "cash",
  TRANSFER: "transfer",
  QR: "qr",
  DEBIT: "debit",
  CREDIT: "credit",
  OTHER: "other",
};

export const DEFAULT_SCHEDULE = {
  openDays: [2, 3, 4, 5, 6], // Mar..Sáb
  intervals: [
    { start: "09:00", end: "12:30" },
    { start: "16:00", end: "20:30" },
  ],
  stepMinutes: 30,
  bufferMin: 0,
};

export const SLOT_RULES = {
  STEP_MINUTES: 30,
  ALLOWED_MINUTES: [0, 30],
};