import { Request, Response, NextFunction } from "express";
import { createWorkoutLogSchema } from "../schemas/workoutLog.schema";
import * as workoutLogsService from "../services/workoutLogs.service";

export async function createWorkoutLog(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createWorkoutLogSchema.parse(req.body);
    const userId = req.user!.id; // Garantizado por el middleware authenticate
    const log = await workoutLogsService.createWorkoutLog(userId, data);
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

export async function getMyWorkoutLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id; // Garantizado por el middleware authenticate
    const logs = await workoutLogsService.getWorkoutLogsByUserId(userId);
    res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
}
