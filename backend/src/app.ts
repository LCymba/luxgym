import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import routinesRoutes from "./routes/routines.routes";
import workoutLogsRoutes from "./routes/workoutLogs.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/routines", routinesRoutes);
app.use("/api/workout-logs", workoutLogsRoutes);
app.use("/api/routines", routinesRoutes);

app.use(errorHandler);

export default app;
