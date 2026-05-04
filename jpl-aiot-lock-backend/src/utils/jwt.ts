import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayload = {
  id: string;
  email: string;
  roleId?: string | null;
  companyId?: string | null;
};

export function signAccessToken(payload: JwtPayload) {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.jwtSecret as Secret, options);
}

export function signRefreshToken(payload: JwtPayload) {
  const options: SignOptions = {
    expiresIn: env.jwtRefreshExpiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.jwtRefreshSecret as Secret, options);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.jwtSecret as Secret) as JwtPayload;
}
