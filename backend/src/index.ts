import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { db } from "./database/pool.js";
import authRoutes from "./routes/auth/auth.routes.js";
import resourceRoutes from "./routes/resources/resources.routes.js";
import adminRoutes from "./routes/admin/admin.routes.js";
import managementRoutes from "./routes/admin/management.routes.js";
import reservationRoutes from "./routes/reservations/reservations.routes.js";
import teamRoutes from "./routes/teams/teams.routes.js";
import profileRoutes from "./routes/profile/profile.routes.js";

const app = express();
const port = Number.parseInt(process.env.PORT ?? "4000", 10);
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be a valid TCP port between 1 and 65535.");
}

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", managementRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/profile", profileRoutes);

app.get("/", (_request, response) => {
  response.json({ name: "RRMS API", status: "running" });
});

app.get("/api/health", async (_request, response) => {
  try {
    await db.query("SELECT 1");
    response.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Database health check failed:", error);
    response.status(503).json({ status: "error", database: "unavailable" });
  }
});

app.use((_request, response) => {
  response.status(404).json({ error: "Route not found." });
});

const server = app.listen(port, () => {
  console.log(`RRMS API listening on http://localhost:${port}`);
});

let shuttingDown = false;
const shutdown = (): void => {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close((error) => {
    if (error) {
      console.error("Error while closing the HTTP server:", error);
      process.exitCode = 1;
    }
    void db.end();
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
