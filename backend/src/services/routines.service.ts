import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { CreateRoutineInput } from "../schemas/routine.schema";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
};

export async function createRoutine(data: CreateRoutineInput) {
  const user = await prisma.user.findUnique({ where: { id: data.userId } });

  if (!user) {
    throw new AppError(404, "Usuario no encontrado");
  }

  return prisma.routine.create({
    data: {
      name: data.name,
      description: data.description,
      userId: data.userId,
    },
    include: { user: { select: userSelect } },
  });
}

export async function listRoutines() {
  return prisma.routine.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: userSelect } },
  });
}

export async function getRoutineById(id: string) {
  const routine = await prisma.routine.findUnique({
    where: { id },
    include: { user: { select: userSelect } },
  });

  if (!routine) {
    throw new AppError(404, "Rutina no encontrada");
  }

  return routine;
}
