"use strict";

export default {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert("businesses", [
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Nico Galicia - Mens Hair Stylist",
        address: "General Paz 16, Las Higueras, Río Cuarto, Córdoba, Argentina",
        whatsapp: "3585737060",
        logo_url: "/LogoNG.png",
        hero_image_url: "/Hero.jpeg",
        schedule_json: JSON.stringify({
          openDays: [2, 3, 4, 5, 6],
          intervals: [
            { start: "09:00", end: "12:30" },
            { start: "16:00", end: "20:30" }
          ],
          stepMinutes: 30,
          bufferMin: 0
        }),
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("businesses", {
      id: "11111111-1111-1111-1111-111111111111"
    });
  }
};