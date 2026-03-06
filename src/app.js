import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { corsOptions } from "./config/cors.js";
import indexRoutes from "./routes/index.routes.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(cookieParser());

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  return res.status(200).json({
    ok: true,
    message: "API de Peluquería NG funcionando.",
  });
});

app.use("/api", indexRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;