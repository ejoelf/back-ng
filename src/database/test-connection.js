import { sequelize } from "./models/index.js";

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a PostgreSQL OK");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
    process.exit(1);
  }
}

testConnection();