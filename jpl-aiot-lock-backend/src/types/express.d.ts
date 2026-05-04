declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      email: string;
      roleId?: string | null;
      companyId?: string | null;
    };
  }
}
