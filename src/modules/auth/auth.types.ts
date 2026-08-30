import type { PublicUser } from "../user/user.types.js";

export interface RegisterInput {
  email: string;
  password: string;
  name?: string | undefined;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: PublicUser;
}
