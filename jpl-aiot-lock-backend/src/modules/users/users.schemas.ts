import { UserStatus } from "@prisma/client";
import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  companyId: z.string().uuid().optional(),
  roleId: z.string().uuid().optional(),
});

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .extend({ password: z.string().min(8).optional() })
  .partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
