"use strict";

export default {
  async up(queryInterface) {
    const now = new Date();

    // 1) servicios
    await queryInterface.bulkInsert("services", [
      {
        id: "44444444-4444-4444-4444-444444444441",
        business_id: "11111111-1111-1111-1111-111111111111",
        code: "corte",
        name: "Corte",
        duration_min: 30,
        price: 13000,
        image_url: "",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: "44444444-4444-4444-4444-444444444442",
        business_id: "11111111-1111-1111-1111-111111111111",
        code: "combo",
        name: "Corte + Barba",
        duration_min: 50,
        price: 16000,
        image_url: "",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: "44444444-4444-4444-4444-444444444443",
        business_id: "11111111-1111-1111-1111-111111111111",
        code: "barba",
        name: "Barba",
        duration_min: 30,
        price: 12000,
        image_url: "",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: "44444444-4444-4444-4444-444444444444",
        business_id: "11111111-1111-1111-1111-111111111111",
        code: "color",
        name: "Color",
        duration_min: 60,
        price: 25000,
        image_url: "",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    // 2) relaciones service_staff
    await queryInterface.bulkInsert("service_staff", [
      // Corte -> Nico + Fernando
      {
        id: "55555555-5555-5555-5555-555555555551",
        service_id: "44444444-4444-4444-4444-444444444441",
        staff_id: "33333333-3333-3333-3333-333333333331",
        created_at: now,
        updated_at: now,
      },
      {
        id: "55555555-5555-5555-5555-555555555552",
        service_id: "44444444-4444-4444-4444-444444444441",
        staff_id: "33333333-3333-3333-3333-333333333332",
        created_at: now,
        updated_at: now,
      },

      // Corte + Barba -> Nico + Fernando
      {
        id: "55555555-5555-5555-5555-555555555553",
        service_id: "44444444-4444-4444-4444-444444444442",
        staff_id: "33333333-3333-3333-3333-333333333331",
        created_at: now,
        updated_at: now,
      },
      {
        id: "55555555-5555-5555-5555-555555555554",
        service_id: "44444444-4444-4444-4444-444444444442",
        staff_id: "33333333-3333-3333-3333-333333333332",
        created_at: now,
        updated_at: now,
      },

      // Barba -> Nico + Fernando
      {
        id: "55555555-5555-5555-5555-555555555555",
        service_id: "44444444-4444-4444-4444-444444444443",
        staff_id: "33333333-3333-3333-3333-333333333331",
        created_at: now,
        updated_at: now,
      },
      {
        id: "55555555-5555-5555-5555-555555555556",
        service_id: "44444444-4444-4444-4444-444444444443",
        staff_id: "33333333-3333-3333-3333-333333333332",
        created_at: now,
        updated_at: now,
      },

      // Color -> solo Nico
      {
        id: "55555555-5555-5555-5555-555555555557",
        service_id: "44444444-4444-4444-4444-444444444444",
        staff_id: "33333333-3333-3333-3333-333333333331",
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("service_staff", {
      id: [
        "55555555-5555-5555-5555-555555555551",
        "55555555-5555-5555-5555-555555555552",
        "55555555-5555-5555-5555-555555555553",
        "55555555-5555-5555-5555-555555555554",
        "55555555-5555-5555-5555-555555555555",
        "55555555-5555-5555-5555-555555555556",
        "55555555-5555-5555-5555-555555555557",
      ],
    });

    await queryInterface.bulkDelete("services", {
      id: [
        "44444444-4444-4444-4444-444444444441",
        "44444444-4444-4444-4444-444444444442",
        "44444444-4444-4444-4444-444444444443",
        "44444444-4444-4444-4444-444444444444",
      ],
    });
  },
};