export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("notifications", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
      primaryKey: true,
    },
    type: {
      type: Sequelize.STRING(30),
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING(120),
      allowNull: false,
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    read: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    data: {
      type: Sequelize.JSONB,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("notifications");
}