import { z } from "zod";

export const exerciseSchema = z.object({
  name: z.string().min(1, "El nombre del ejercicio es obligatorio"),
  sets: z.number().int().positive().optional().nullable(),
  reps: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createRoutineSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional().nullable(),
  userId: z.string().min(1, "El userId es obligatorio"),
  exercises: z.array(exerciseSchema).optional().default([]),
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;

