import { Router } from "express";
import * as routinesController from "../controllers/routines.controller";

const router = Router();

router.post("/", routinesController.createRoutine);
router.get("/", routinesController.listRoutines);
router.get("/:id", routinesController.getRoutine);

export default router;
