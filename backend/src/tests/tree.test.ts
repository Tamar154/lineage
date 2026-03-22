import { describe, it, expect, beforeEach } from "vitest";
import { createUserAgent } from "./helpers/auth.js";
import { prisma } from "../config/db.js";
import request from "supertest";
import { app } from "../server.js";
import { randomUUID } from "crypto";

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

    it("should not allow creating a tree with an empty name", async () => {
      const res = await user.agent.post("/api/trees").send({ name: "" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/tree name is required|invalid/i);
    });

    it("should reject creating a tree with whitespace name", async () => {
      const res = await user.agent.post("/api/trees").send({ name: "   " });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/tree name is required|invalid/i);
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
        name: "Other User",
      });
      await otherUser.register();
      await otherUser.login();
      await otherUser.agent
        .post("/api/trees")
        .send({ name: "Other User's Tree" });

      const res = await user.agent.get("/api/trees");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveLength(0);
    });

    it("should return an empty list for a user with no trees", async () => {
      const res = await user.agent.get("/api/trees");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toEqual([]);
    });
  });

  describe("GET /api/trees/:treeId", () => {
    it("should get a specific tree by ID", async () => {
      const created = await user.agent
        .post("/api/trees")
        .send({ name: "Family Tree" });
      const treeId = created.body.data.id;

      const res = await user.agent.get(`/api/trees/${treeId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.id).toBe(treeId);
      expect(res.body.data.name).toBe("Family Tree");
    });

    it("should not allow unauthenticated users to get a specific tree by ID", async () => {
      const created = await user.agent
        .post("/api/trees")
        .send({ name: "Family Tree" });
      const treeId = created.body.data.id;

      const res = await request(app).get(`/api/trees/${treeId}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not authorized|unauthorized/i);
    });

    it("should not allow a user to get another user's tree by ID", async () => {
      const otherUser = createUserAgent({ name: "Other User" });
      await otherUser.register();
      await otherUser.login();

      const created = await otherUser.agent
        .post("/api/trees")
        .send({ name: "Other User's Tree" });
      const treeId = created.body.data.id;

      const res = await user.agent.get(`/api/trees/${treeId}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|permission/i);
    });

    it("should return 404 for a non-existent tree ID", async () => {
      const missingTreeId = randomUUID();

      const res = await user.agent.get(`/api/trees/${missingTreeId}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|permission/i);
    });

    it("should return 400 for an invalid tree ID format", async () => {
      const res = await user.agent.get("/api/trees/not-a-uuid");

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid|uuid/i);
    });
  });

  describe("DELETE /api/trees/:treeId", () => {
    it("should delete a tree", async () => {
      const created = await user.agent
        .post("/api/trees")
        .send({ name: "Delete Me" });
      const treeId = created.body.data.id;

      const res = await user.agent.delete(`/api/trees/${treeId}`);

      expect(res.status).toBe(204);

      const tree = await prisma.tree.findUnique({ where: { id: treeId } });
      expect(tree).toBeNull();
    });

    it("should not allow unauthenticated users to delete a tree", async () => {
      const created = await user.agent
        .post("/api/trees")
        .send({ name: "Delete Me" });
      const treeId = created.body.data.id;

      const res = await request(app).delete(`/api/trees/${treeId}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not authorized|unauthorized/i);
    });

    it("should not allow a user to delete another user's tree", async () => {
      const otherUser = createUserAgent({ name: "Other User" });
      await otherUser.register();
      await otherUser.login();

      const created = await otherUser.agent
        .post("/api/trees")
        .send({ name: "Other User's Tree" });
      const treeId = created.body.data.id;

      const res = await user.agent.delete(`/api/trees/${treeId}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|permission/i);

      const tree = await prisma.tree.findUnique({ where: { id: treeId } });
      expect(tree).not.toBeNull();
    });

    it("should return 400 when deleting with an invalid tree ID format", async () => {
      const res = await user.agent.delete("/api/trees/not-a-uuid");

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid|uuid/i);
    });

    it("should return 404 when deleting a non-existent tree", async () => {
      const missingTreeId = randomUUID();

      const res = await user.agent.delete(`/api/trees/${missingTreeId}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|permission/i);
    });
  });
});
