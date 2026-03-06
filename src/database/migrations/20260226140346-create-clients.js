export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("clients", {
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

      phone: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },

      birthday: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      tags_json: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },

      is_deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      deleted_at: {
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

    await queryInterface.addIndex("clients", ["business_id", "phone"], {
      unique: true,
      name: "clients_business_id_phone_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("clients");
  },
};