import { Request, Response, NextFunction } from "express";
import { createUserSchema } from "../schemas/user.schema";
import * as usersService from "../services/users.service";

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await usersService.createUser(data);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function listUsers(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const users = await usersService.listUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function getUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await usersService.getUserById(String(req.params.id));
    res.json(user);
  } catch (err) {
    next(err);
  }
}
