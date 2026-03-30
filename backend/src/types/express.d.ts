import type { JwtPayload } from "./jwt.ts";
import type { Tree } from "../generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
      tree: Tree;
    }
  }
}
