export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("blocks", {
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

      staff_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "staff",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      date_str: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      start: {
        type: Sequelize.STRING(5),
        allowNull: false,
      },

      end: {
        type: Sequelize.STRING(5),
        allowNull: false,
      },

      reason: {
        type: Sequelize.STRING(255),
        allowNull: true,
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

    await queryInterface.addIndex("blocks", ["business_id", "date_str"], {
      name: "blocks_business_id_date_str_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("blocks");
  },
};