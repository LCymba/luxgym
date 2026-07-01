import { z } from "zod";

export const createRoutineSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  userId: z.string().min(1, "El userId es obligatorio"),
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
