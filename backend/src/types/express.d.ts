import type { Tree } from "../generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
      };
      tree: Tree;
    }
  }
}
