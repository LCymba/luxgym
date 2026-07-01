import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["MEMBER", "TRAINER", "ADMIN", "OWNER"]).optional().default("MEMBER"),
  membershipExpiry: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
