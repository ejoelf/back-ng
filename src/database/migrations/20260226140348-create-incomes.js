export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("incomes", {
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

      appointment_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "appointments",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      service_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "services",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      service_name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },

      client_name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },

      amount_estimated: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      amount_final: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      payment_method: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },

      paid_status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "pending",
      },

      detail: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      paid_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex("incomes", ["business_id", "date"], {
      name: "incomes_business_id_date_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("incomes");
  },
};