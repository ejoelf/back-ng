"use strict";

import bcrypt from "bcryptjs";

export default {
  async up(queryInterface) {
    const now = new Date();
    const passwordHash = await bcrypt.hash("nico789", 10);

    await queryInterface.bulkInsert("users", [
      {
        id: "22222222-2222-2222-2222-222222222222",
        username: "nico",
        password_hash: passwordHash,
        role: "admin",
        is_active: true,
        last_login_at: null,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", {
      id: "22222222-2222-2222-2222-222222222222",
    });
  },
};