import type { JwtPayload } from "./jwt.ts";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      tree?: import("../generated/prisma/client").Tree;
    }
  }
}
