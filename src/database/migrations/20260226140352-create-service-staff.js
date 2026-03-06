export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("service_staff", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        allowNull: false,
        primaryKey: true,
      },

      service_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "services",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      staff_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "staff",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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

    await queryInterface.addIndex("service_staff", ["service_id", "staff_id"], {
      unique: true,
      name: "service_staff_service_id_staff_id_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("service_staff");
  },
};