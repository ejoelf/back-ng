"use strict";

export default {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert("staff", [
      {
        id: "33333333-3333-3333-3333-333333333331",
        business_id: "11111111-1111-1111-1111-111111111111",
        name: "Nicolás Galicia",
        first_name: "Nicolás",
        last_name: "Galicia",
        age: null,
        birthday: null,
        phone: null,
        dni: null,
        address: null,
        bio: "Con años de trayectoria y una ética de trabajo impecable. Confianza, estilo y pasión en cada corte.",
        photo_url: "",
        skills_json: JSON.stringify(["corte", "barba", "color", "reflejos"]),
        schedule_override_json: null,
        is_owner: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: "33333333-3333-3333-3333-333333333332",
        business_id: "11111111-1111-1111-1111-111111111111",
        name: "Fernando",
        first_name: "Fernando",
        last_name: "",
        age: null,
        birthday: null,
        phone: null,
        dni: null,
        address: null,
        bio: "Especialista en barba y cortes clásicos/modernos. Atención al detalle y prolijidad.",
        photo_url: "",
        skills_json: JSON.stringify(["corte", "barba"]),
        schedule_override_json: null,
        is_owner: false,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("staff", {
      id: [
        "33333333-3333-3333-3333-333333333331",
        "33333333-3333-3333-3333-333333333332",
      ],
    });
  },
};