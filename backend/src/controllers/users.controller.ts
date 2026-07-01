import { Request, Response, NextFunction } from "express";
import { createUserSchema } from "../schemas/user.schema";
import * as usersService from "../services/users.service";
import { AppError } from "../middleware/errorHandler";

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

export async function listMembers(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const members = await usersService.listMembers();
    res.json(members);
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
    const id = String(req.params.id);
    
    // Si es un cliente (MEMBER), solo puede ver su propio perfil
    if (req.user?.role === "MEMBER" && req.user.id !== id) {
      throw new AppError(403, "Acceso denegado: No puede consultar el perfil de otro usuario");
    }

    const user = await usersService.getUserById(id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}
