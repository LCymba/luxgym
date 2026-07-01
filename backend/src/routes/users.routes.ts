import { Router } from "express";
import * as usersController from "../controllers/users.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.post("/", authenticate, authorize("ADMIN", "OWNER"), usersController.createUser);
router.get("/members", authenticate, authorize("TRAINER", "ADMIN", "OWNER"), usersController.listMembers);
router.get("/", authenticate, authorize("ADMIN", "OWNER"), usersController.listUsers);
router.get("/:id", authenticate, usersController.getUser);

export default router;
