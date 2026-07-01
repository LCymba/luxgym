import { Router } from "express";
import * as usersController from "../controllers/users.controller";

const router = Router();

router.post("/", usersController.createUser);
router.get("/", usersController.listUsers);
router.get("/:id", usersController.getUser);

export default router;
