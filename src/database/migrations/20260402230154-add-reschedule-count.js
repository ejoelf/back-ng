export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("appointments", "reschedule_count", {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("appointments", "reschedule_count");
}