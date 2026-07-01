import { z } from "zod";

export const createWorkoutLogSchema = z.object({
  routineId: z.string().min(1, "El routineId es obligatorio"),
  completedEx: z.array(z.string()).min(1, "Debe completar al menos un ejercicio"),
});

export type CreateWorkoutLogInput = z.infer<typeof createWorkoutLogSchema>;
