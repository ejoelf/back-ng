export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("appointments", "confirmation_code", {
    type: Sequelize.STRING(10),
    allowNull: true, // ⚠️ primero true para no romper datos viejos
  });

  await queryInterface.addConstraint("appointments", {
    fields: ["confirmation_code"],
    type: "unique",
    name: "unique_confirmation_code",
  });
}

export async function down(queryInterface) {
  await queryInterface.removeConstraint("appointments", "unique_confirmation_code");
  await queryInterface.removeColumn("appointments", "confirmation_code");
}