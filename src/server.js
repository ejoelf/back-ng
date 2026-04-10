import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import { env } from "./config/env.js";
import { testDatabaseConnection } from "./database/models/index.js";

// 🔥 Crear server HTTP manual
const server = http.createServer(app);

// 🔥 Inicializar socket
export const io = new Server(server, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado:", socket.id);
  });
});

async function bootstrap() {
  try {
    await testDatabaseConnection();

    server.listen(env.port, () => {
      console.log(`🚀 Backend corriendo en http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("❌ No se pudo iniciar el servidor:", error.message);
    process.exit(1);
  }
}

bootstrap();