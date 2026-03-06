export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("businesses", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        allowNull: false,
        primaryKey: true,
      },

      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },

      address: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      whatsapp: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },

      logo_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      hero_image_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      schedule_json: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          openDays: [2, 3, 4, 5, 6],
          intervals: [
            { start: "09:00", end: "12:30" },
            { start: "16:00", end: "20:30" },
          ],
          stepMinutes: 30,
          bufferMin: 0,
        },
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("businesses");
  },
};