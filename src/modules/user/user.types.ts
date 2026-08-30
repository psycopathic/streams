export type UserRole = "USER" | "ADMIN";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type SafeUser = Omit<UserRecord, "passwordHash">;

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateCurrentUserInput {
  name?: string | null | undefined;
}
