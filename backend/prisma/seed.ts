import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando el sembrado de datos (seed)...");

  // 1. Limpiar la base de datos en orden para respetar las FK
  await prisma.workoutLog.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.routine.deleteMany();
  await prisma.user.deleteMany();

  console.log("Base de datos limpia.");

  // 2. Hashear contraseña común para pruebas
  const defaultPassword = "Test1234!";
  const hashedPassword = await bcryptjs.hash(defaultPassword, 10);

  // 3. Crear Dueño (OWNER)
  const owner = await prisma.user.create({
    data: {
      name: "Kevin Lux",
      email: "owner@luxgym.com",
      password: hashedPassword,
      role: "OWNER",
    },
  });

  // 4. Crear Administrador (ADMIN)
  const admin = await prisma.user.create({
    data: {
      name: "Sofía Recepción",
      email: "admin@luxgym.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // 5. Crear Profesores (TRAINER)
  const trainer1 = await prisma.user.create({
    data: {
      name: "Lucas Trainer",
      email: "profe1@luxgym.com",
      password: hashedPassword,
      role: "TRAINER",
    },
  });

  const trainer2 = await prisma.user.create({
    data: {
      name: "Martina Pro",
      email: "profe2@luxgym.com",
      password: hashedPassword,
      role: "TRAINER",
    },
  });

  console.log("Usuarios administrativos, dueño y profesores creados.");

  // 6. Crear Clientes (MEMBER) con membresías variables
  const now = new Date();

  // Membresía vigente por 30 días
  const expiryActive = new Date();
  expiryActive.setDate(now.getDate() + 30);

  // Membresía vencida hace 5 días
  const expiryExpired = new Date();
  expiryExpired.setDate(now.getDate() - 5);

  // Membresía que vence mañana
  const expiryExpiringSoon = new Date();
  expiryExpiringSoon.setDate(now.getDate() + 1);

  const client1 = await prisma.user.create({
    data: {
      name: "Juan Pérez",
      email: "juan@luxgym.com",
      password: hashedPassword,
      role: "MEMBER",
      membershipExpiry: expiryActive,
    },
  });

  const client2 = await prisma.user.create({
    data: {
      name: "María Gómez",
      email: "maria@luxgym.com",
      password: hashedPassword,
      role: "MEMBER",
      membershipExpiry: expiryActive,
    },
  });

  const client3 = await prisma.user.create({
    data: {
      name: "Carlos Rodríguez",
      email: "carlos@luxgym.com",
      password: hashedPassword,
      role: "MEMBER",
      membershipExpiry: expiryExpired, // Vencido
    },
  });

  const client4 = await prisma.user.create({
    data: {
      name: "Ana Martínez",
      email: "ana@luxgym.com",
      password: hashedPassword,
      role: "MEMBER",
      membershipExpiry: expiryExpiringSoon, // Vence pronto
    },
  });

  const client5 = await prisma.user.create({
    data: {
      name: "Diego Fernández",
      email: "diego@luxgym.com",
      password: hashedPassword,
      role: "MEMBER",
      membershipExpiry: expiryActive,
    },
  });

  console.log("Clientes creados.");

  // 7. Crear Rutinas y Ejercicios para Juan Pérez (client1) - Rutina Hipertrofia Pecho y Tríceps
  const routineJuan = await prisma.routine.create({
    data: {
      name: "Rutina Hipertrofia: Pecho y Tríceps",
      description: "Rutina enfocada en volumen muscular para tren superior empujes.",
      userId: client1.id,
    },
  });

  const exercisesJuan = [
    await prisma.exercise.create({
      data: { name: "Press de Banca Plano con Barra", sets: 4, reps: 10, notes: "Última serie al fallo técnico", routineId: routineJuan.id },
    }),
    await prisma.exercise.create({
      data: { name: "Press Inclinado con Mancuernas", sets: 3, reps: 12, notes: "Controlar bajada de 3 segundos", routineId: routineJuan.id },
    }),
    await prisma.exercise.create({
      data: { name: "Cruces de Polea Alta para Pecho", sets: 3, reps: 15, notes: "Sostener contracción de 1 segundo", routineId: routineJuan.id },
    }),
    await prisma.exercise.create({
      data: { name: "Extensión de Tríceps en Polea Alta", sets: 4, reps: 12, notes: "Codos pegados al cuerpo", routineId: routineJuan.id },
    }),
    await prisma.exercise.create({
      data: { name: "Fondos de Tríceps entre Paralelas", sets: 3, reps: 8, notes: "Hacer con el propio peso o lastre", routineId: routineJuan.id },
    }),
  ];

  // Rutinas para María Gómez (client2) - Rutina Pierna y Glúteo Enfoque Fuerza
  const routineMaria = await prisma.routine.create({
    data: {
      name: "Rutina Fuerza: Piernas y Glúteos",
      description: "Rutina enfocada en fuerza e hipertrofia del tren inferior.",
      userId: client2.id,
    },
  });

  const exercisesMaria = [
    await prisma.exercise.create({
      data: { name: "Sentadilla Libre con Barra", sets: 4, reps: 8, notes: "Bajar a 90° o profundo con buena técnica", routineId: routineMaria.id },
    }),
    await prisma.exercise.create({
      data: { name: "Sillón de Cuádriceps", sets: 3, reps: 12, notes: "Hacer isometría de 1 segundo arriba", routineId: routineMaria.id },
    }),
    await prisma.exercise.create({
      data: { name: "Prensa de Piernas inclinada", sets: 4, reps: 10, notes: "Pies bien separados para mayor enfoque", routineId: routineMaria.id },
    }),
    await prisma.exercise.create({
      data: { name: "Hip Thrust con Barra", sets: 4, reps: 10, notes: "Apretar glúteos arriba por 2 segundos", routineId: routineMaria.id },
    }),
    await prisma.exercise.create({
      data: { name: "Peso Muerto Rumano con Mancuernas", sets: 3, reps: 12, notes: "Mantener espalda recta e isquios estirados", routineId: routineMaria.id },
    }),
  ];

  // Rutinas por defecto para los demás clientes
  const routineCarlos = await prisma.routine.create({
    data: {
      name: "Rutina de Acondicionamiento Físico",
      description: "Rutina básica de adaptación metabólica y fuerza general.",
      userId: client3.id,
    },
  });
  await prisma.exercise.create({
    data: { name: "Prensa de Piernas horizontal", sets: 3, reps: 12, routineId: routineCarlos.id },
  });
  await prisma.exercise.create({
    data: { name: "Jalón al Pecho", sets: 3, reps: 12, routineId: routineCarlos.id },
  });

  const routineAna = await prisma.routine.create({
    data: {
      name: "Rutina Quema de Grasa / Cardio",
      description: "Rutina de circuitos dinámicos de alta intensidad.",
      userId: client4.id,
    },
  });
  await prisma.exercise.create({
    data: { name: "Estocadas caminando", sets: 3, reps: 20, notes: "10 de ida, 10 de vuelta", routineId: routineAna.id },
  });
  await prisma.exercise.create({
    data: { name: "Burpees", sets: 3, reps: 10, notes: "Máxima velocidad posible", routineId: routineAna.id },
  });

  console.log("Rutinas y ejercicios creados.");

  // 8. Crear algunos registros de entrenamientos (WorkoutLog) de prueba
  // Juan Pérez entrenó ayer y hoy
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  await prisma.workoutLog.create({
    data: {
      userId: client1.id,
      routineId: routineJuan.id,
      date: yesterday,
      // Se completaron los ejercicios 1, 2 y 4 de la rutina
      completedEx: JSON.stringify([exercisesJuan[0].id, exercisesJuan[1].id, exercisesJuan[3].id]),
    },
  });

  await prisma.workoutLog.create({
    data: {
      userId: client1.id,
      routineId: routineJuan.id,
      date: now,
      // Se completaron todos los ejercicios hoy
      completedEx: JSON.stringify(exercisesJuan.map((e) => e.id)),
    },
  });

  // María Gómez entrenó ayer
  await prisma.workoutLog.create({
    data: {
      userId: client2.id,
      routineId: routineMaria.id,
      date: yesterday,
      // Se completaron los ejercicios 1, 4 y 5
      completedEx: JSON.stringify([exercisesMaria[0].id, exercisesMaria[3].id, exercisesMaria[4].id]),
    },
  });

  console.log("Workout logs creados.");

  console.log("\n--- SEMBRADO COMPLETADO CON ÉXITO ---");
  console.log("Cuentas disponibles para pruebas (Contraseña común: Test1234!):");
  console.log("- Dueño: owner@luxgym.com");
  console.log("- Recepcionista / Admin: admin@luxgym.com");
  console.log("- Profe 1: profe1@luxgym.com");
  console.log("- Profe 2: profe2@luxgym.com");
  console.log("- Socio (Vigente): juan@luxgym.com");
  console.log("- Socio (Vigente): maria@luxgym.com");
  console.log("- Socio (Vencido): carlos@luxgym.com");
  console.log("- Socio (Vence Pronto): ana@luxgym.com");
  console.log("-------------------------------------\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
