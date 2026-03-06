import app from "./app.js";
import { env } from "./config/env.js";
import { testDatabaseConnection } from "./database/models/index.js";

async function bootstrap() {
  try {
    await testDatabaseConnection();

    app.listen(env.port, () => {
      console.log(`🚀 Backend corriendo en http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("❌ No se pudo iniciar el servidor:", error.message);
    process.exit(1);
  }
}

bootstrap();