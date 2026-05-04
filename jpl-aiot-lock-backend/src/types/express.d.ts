declare namespace Express {
  export interface Request {
    user?: {
      userId: string;
      id: string;
      role?: string;
      companyId?: string | null;
    };
  }
}
