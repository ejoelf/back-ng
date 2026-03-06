export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("staff", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        allowNull: false,
        primaryKey: true,
      },

      business_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "businesses",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },

      first_name: {
        type: Sequelize.STRING(60),
        allowNull: true,
      },

      last_name: {
        type: Sequelize.STRING(60),
        allowNull: true,
      },

      age: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      birthday: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      phone: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },

      dni: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },

      address: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      photo_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      skills_json: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },

      schedule_override_json: {
        type: Sequelize.JSONB,
        allowNull: true,
      },

      is_owner: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
    await queryInterface.dropTable("staff");
  },
};