import { Router } from "express";
import * as workoutLogsController from "../controllers/workoutLogs.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.post("/", authenticate, authorize("MEMBER"), workoutLogsController.createWorkoutLog);
router.get("/me", authenticate, authorize("MEMBER"), workoutLogsController.getMyWorkoutLogs);

export default router;
