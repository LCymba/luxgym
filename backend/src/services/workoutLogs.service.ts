import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { CreateWorkoutLogInput } from "../schemas/workoutLog.schema";

export async function createWorkoutLog(userId: string, data: CreateWorkoutLogInput) {
  // Verificar que la rutina exista y pertenezca al usuario
  const routine = await prisma.routine.findUnique({
    where: { id: data.routineId },
  });

  if (!routine) {
    throw new AppError(404, "Rutina no encontrada");
  }

  if (routine.userId !== userId) {
    throw new AppError(403, "Acceso denegado: Esta rutina no te pertenece");
  }

  return prisma.workoutLog.create({
    data: {
      userId,
      routineId: data.routineId,
      completedEx: JSON.stringify(data.completedEx),
    },
    include: {
      routine: true,
    },
  });
}

export async function getWorkoutLogsByUserId(userId: string) {
  const logs = await prisma.workoutLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    include: {
      routine: {
        include: {
          exercises: true,
        },
      },
    },
  });

  // Mapear completedEx de vuelta a un array de strings (JSON.parse) para facilitar el uso en el frontend
  return logs.map((log) => ({
    ...log,
    completedEx: JSON.parse(log.completedEx) as string[],
  }));
}
