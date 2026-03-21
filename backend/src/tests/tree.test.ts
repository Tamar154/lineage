import { describe, it, expect, beforeEach } from "vitest";
import { createUserAgent } from "./helpers/auth.js";
import { prisma } from "../config/db.js";
import request from "supertest";
import { app } from "../server.js";

describe("Tree", () => {
  let user: ReturnType<typeof createUserAgent>;

  beforeEach(async () => {
    user = createUserAgent();
    await user.register();
    await user.login();
  });

  describe("POST /api/trees", () => {
    it("should create a new tree", async () => {
      const res = await user.agent.post("/api/trees").send({ name: "My Tree" });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.name).toBe("My Tree");

      // Verify tree is in the database
      const tree = await prisma.tree.findUnique({
        where: { id: res.body.data.id },
      });

      if (!tree) {
        throw new Error("Tree not found in database");
      }

      expect(tree).not.toBeNull();
      expect(tree.name).toBe("My Tree");
    });

    it("Should not allow creating a tree with the same name", async () => {
      await user.agent.post("/api/trees").send({ name: "My Tree" });
      const res = await user.agent.post("/api/trees").send({ name: "My Tree" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it("Should not allow unauthenticated users to create a tree", async () => {
      const res = await request(app)
        .post("/api/trees")
        .send({ name: "My Tree" });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not authorized|unauthorized/i);
    });
  });

  describe("GET /api/trees", () => {
    it("should get only user's trees", async () => {
      // Create a tree for this user
      await user.agent.post("/api/trees").send({ name: "User's Tree1" });
      await user.agent.post("/api/trees").send({ name: "User's Tree2" });

      // Create a tree for another user
      const otherUser = createUserAgent({
        email: "other@example.com",
        name: "Other User",
      });
      await otherUser.register();
      await otherUser.agent
        .post("/api/trees")
        .send({ name: "Other User's Tree" });

      const res = await user.agent.get("/api/trees");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].name).toBe("User's Tree1");
      expect(res.body.data[1].name).toBe("User's Tree2");
    });

    it("should not allow unauthenticated users to get trees", async () => {
      const res = await request(app).get("/api/trees");
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not authorized|unauthorized/i);
    });

    it("should not allow a user to get another user's trees", async () => {
      // Create a tree for another user
      const otherUser = createUserAgent({
        email: "other@example.com",
        name: "Other User",
      });
      await otherUser.register();
      await otherUser.agent
        .post("/api/trees")
        .send({ name: "Other User's Tree" });

      const res = await user.agent.get("/api/trees");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe("GET /api/trees/:id", () => {
    it("should get a specific tree by ID", async () => {});

    it("should not allow unauthenticated users to get a specific tree by ID", async () => {});
    it("should not allow a user to get another user's tree by ID", async () => {});

    it("", async () => {});
  });
});
