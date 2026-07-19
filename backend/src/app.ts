import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import routinesRoutes from "./routes/routines.routes";
import workoutLogsRoutes from "./routes/workoutLogs.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim())
  : ["http://localhost:5500", "http://127.0.0.1:5500"];

app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? allowedOrigins
        : true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/routines", routinesRoutes);
app.use("/api/workout-logs", workoutLogsRoutes);

app.use(errorHandler);

export default app;
