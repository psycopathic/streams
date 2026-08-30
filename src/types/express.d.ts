import type { UserRole } from "../modules/user/user.types.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export {};
