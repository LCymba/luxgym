import { Request, Response, NextFunction } from "express";
import { createRoutineSchema } from "../schemas/routine.schema";
import * as routinesService from "../services/routines.service";
import { AppError } from "../middleware/errorHandler";

export async function createRoutine(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = createRoutineSchema.parse(req.body);
    const routine = await routinesService.createRoutine(data);
    res.status(201).json(routine);
  } catch (err) {
    next(err);
  }
}

export async function listRoutines(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const routines = await routinesService.listRoutines();
    res.json(routines);
  } catch (err) {
    next(err);
  }
}

export async function getRoutine(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = String(req.params.id);
    const routine = await routinesService.getRoutineById(id);
    
    // Si es un cliente (MEMBER), solo puede consultar su propia rutina
    if (req.user?.role === "MEMBER" && routine.userId !== req.user.id) {
      throw new AppError(403, "Acceso denegado: No puede consultar rutinas de otros usuarios");
    }

    res.json(routine);
  } catch (err) {
    next(err);
  }
}
