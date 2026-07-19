import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { LoginInput, RegisterInput } from "../schemas/auth.schema";

// Como el package.json usa bcryptjs, debemos importar bcryptjs
import bcryptjs from "bcryptjs";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-luxury-gym-key-2026";

function generateToken(user: { id: string; email: string; name: string; role: string }) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError(401, "Credenciales inválidas");
  }

  const isPasswordValid = await bcryptjs.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, "Credenciales inválidas");
  }

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      membershipExpiry: user.membershipExpiry,
    },
    token,
  };
}

export async function register(data: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new AppError(409, "El email ya está registrado");
  }

  const hashedPassword = await bcryptjs.hash(data.password, SALT_ROUNDS);

  // Los nuevos usuarios que se registran solos por defecto son MEMBER
  // Les damos 30 días de membresía gratis al registrarse
  const membershipExpiry = new Date();
  membershipExpiry.setDate(membershipExpiry.getDate() + 30);

  // Usar transacción de Prisma para crear usuario, rutina inicial y ejercicios
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "MEMBER",
        membershipExpiry,
      },
    });

    const routine = await tx.routine.create({
      data: {
        name: "Rutina Inicial: Adaptación",
        description: "Rutina para tus primeros días de entrenamiento en LuxGym. ¡Bienvenido!",
        userId: user.id,
      },
    });

    await tx.exercise.createMany({
      data: [
        {
          name: "Cinta de correr (Cardio)",
          sets: 1,
          reps: 15,
          notes: "15 minutos de caminata/trote suave para calentar",
          routineId: routine.id,
        },
        {
          name: "Prensa de Piernas a 45°",
          sets: 3,
          reps: 12,
          notes: "Mantener la espalda bien apoyada en el respaldo",
          routineId: routine.id,
        },
        {
          name: "Sillón de Cuádriceps",
          sets: 3,
          reps: 15,
          notes: "Movimiento controlado en la subida y bajada",
          routineId: routine.id,
        },
        {
          name: "Polea Alta de Espalda (Jalón al pecho)",
          sets: 3,
          reps: 12,
          notes: "Traer la barra al pecho, no atrás de la nuca",
          routineId: routine.id,
        },
        {
          name: "Prensa de Pecho (Machine Chest Press)",
          sets: 3,
          reps: 12,
          notes: "Empujar sin trabar los codos al final",
          routineId: routine.id,
        },
        {
          name: "Vuelos Laterales con Mancuernas",
          sets: 3,
          reps: 15,
          notes: "Elevar hasta la altura de los hombros",
          routineId: routine.id,
        },
        {
          name: "Abdominales (Crunch)",
          sets: 3,
          reps: 20,
          notes: "Concentrar la fuerza en el abdomen, no en el cuello",
          routineId: routine.id,
        },
      ],
    });

    return user;
  });

  const token = generateToken(result);

  return {
    user: {
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role,
      membershipExpiry: result.membershipExpiry,
    },
    token,
  };
}
