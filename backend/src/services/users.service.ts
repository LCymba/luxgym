import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { CreateUserInput } from "../schemas/user.schema";

const SALT_ROUNDS = 10;

function omitPassword<T extends { password: string }>(
  user: T,
): Omit<T, "password"> {
  const { password: _, ...rest } = user;
  return rest;
}

export async function createUser(data: CreateUserInput) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new AppError(409, "El email ya está registrado");
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
  });

  return omitPassword(user);
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return users.map(omitPassword);
}

export async function listMembers() {
  return prisma.user.findMany({
    where: { role: "MEMBER" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      membershipExpiry: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      routines: {
        include: {
          exercises: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, "Usuario no encontrado");
  }

  return omitPassword(user);
}
