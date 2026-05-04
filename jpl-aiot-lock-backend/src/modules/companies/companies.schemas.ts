import { CompanyStatus } from "@prisma/client";
import { z } from "zod";

export const companyIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createCompanySchema = z.object({
  name: z.string().min(2),
  rut: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.nativeEnum(CompanyStatus).optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
