import { Router } from "express";
import * as routinesController from "../controllers/routines.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.post("/", authenticate, authorize("TRAINER", "OWNER"), routinesController.createRoutine);
router.get("/", authenticate, authorize("TRAINER", "ADMIN", "OWNER"), routinesController.listRoutines);
router.get("/:id", authenticate, routinesController.getRoutine);

export default router;
