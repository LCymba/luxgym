import { Request, Response, NextFunction } from "express";
import { createRoutineSchema } from "../schemas/routine.schema";
import * as routinesService from "../services/routines.service";

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
    const routine = await routinesService.getRoutineById(String(req.params.id));
    res.json(routine);
  } catch (err) {
    next(err);
  }
}
