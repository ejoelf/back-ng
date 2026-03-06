export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("special_days", {
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

      date_str: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      open: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      intervals_json: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
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

    await queryInterface.addIndex("special_days", ["business_id", "date_str"], {
      unique: true,
      name: "special_days_business_id_date_str_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("special_days");
  },
};