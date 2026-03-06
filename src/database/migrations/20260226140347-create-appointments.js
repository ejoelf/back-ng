export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("appointments", {
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

      client_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "clients",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      service_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "services",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      staff_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "staff",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      client_name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },

      client_phone: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },

      client_email: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },

      service_name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },

      staff_name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },

      price: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      start_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      end_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "confirmed",
      },

      channel: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "web",
      },

      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      allow_overlap: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.addIndex("appointments", ["business_id", "start_at"], {
      name: "appointments_business_id_start_at_idx",
    });

    await queryInterface.addIndex("appointments", ["staff_id", "start_at"], {
      name: "appointments_staff_id_start_at_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("appointments");
  },
};