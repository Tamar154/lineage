import { describe, it, expect, beforeEach } from "vitest";
import { createUserAgent } from "./helpers/auth.js";
import { prisma } from "../config/db.js";
import request from "supertest";
import { app } from "../server.js";
import { randomUUID } from "crypto";

describe("Relationship", () => {
  let user: ReturnType<typeof createUserAgent>;
  let treeId: string;
  let personAId: string;
  let personBId: string;
  let personCId: string;

  beforeEach(async () => {
    user = createUserAgent();
    await user.register();
    await user.login();

    const treeRes = await user.agent
      .post("/api/trees")
      .send({ name: "Test Tree" });
    treeId = treeRes.body.data.id;

    const personA = await user.agent
      .post(`/api/trees/${treeId}/persons`)
      .send({ firstName: "Alice", lastName: "Smith" });
    personAId = personA.body.data.id;

    const personB = await user.agent
      .post(`/api/trees/${treeId}/persons`)
      .send({ firstName: "Bob", lastName: "Smith" });
    personBId = personB.body.data.id;

    const personC = await user.agent
      .post(`/api/trees/${treeId}/persons`)
      .send({ firstName: "Charlie", lastName: "Smith" });
    personCId = personC.body.data.id;
  });

  async function createRelationship(
    overrides: Record<string, unknown> = {},
    agent = user.agent,
    tree = treeId,
  ) {
    return agent.post(`/api/trees/${tree}/relationships`).send({
      personAId,
      personBId,
      type: "SPOUSE",
      ...overrides,
    });
  }

  describe("POST /api/trees/:treeId/relationships", () => {
    it("should create a SPOUSE relationship", async () => {
      const res = await createRelationship({ type: "SPOUSE" });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect([res.body.data.personAId, res.body.data.personBId]).toContain(
        personAId,
      );
      expect([res.body.data.personAId, res.body.data.personBId]).toContain(
        personBId,
      );
      expect(res.body.data.type).toBe("SPOUSE");
    });

    it("should create a PARENT relationship", async () => {
      const res = await createRelationship({ type: "PARENT" });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe("PARENT");
    });

    it("should include id in the response", async () => {
      const res = await createRelationship();

      expect(res.body.data.id).toBeDefined();
    });

    it("should persist the relationship in the database", async () => {
      const res = await createRelationship({ type: "SPOUSE" });
      const id = res.body.data.id;

      const rel = await prisma.relationship.findUnique({ where: { id } });
      expect(rel).not.toBeNull();
      expect([rel!.personAId, rel!.personBId]).toContain(personAId);
      expect([rel!.personAId, rel!.personBId]).toContain(personBId);
    });

    it("should reject a self-relationship", async () => {
      const res = await createRelationship({
        personAId,
        personBId: personAId,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/relationship with themselves/i);
    });

    it("should reject if personA does not belong to the tree", async () => {
      const res = await createRelationship({ personAId: randomUUID() });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/belong to the same tree/i);
    });

    it("should reject if personB does not belong to the tree", async () => {
      const res = await createRelationship({ personBId: randomUUID() });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/belong to the same tree/i);
    });

    it("should reject if persons belong to different trees", async () => {
      const tree2Res = await user.agent
        .post("/api/trees")
        .send({ name: "Other Tree" });
      const tree2Id = tree2Res.body.data.id;

      const personInTree2 = await user.agent
        .post(`/api/trees/${tree2Id}/persons`)
        .send({ firstName: "Dave", lastName: "Smith" });

      const res = await createRelationship({
        personBId: personInTree2.body.data.id,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/belong to the same tree/i);
    });

    it("should reject an exact duplicate SPOUSE relationship", async () => {
      await createRelationship({ type: "SPOUSE" });
      const res = await createRelationship({ type: "SPOUSE" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it("should reject a reversed SPOUSE relationship (B,A) when (A,B) exists", async () => {
      await createRelationship({ personAId, personBId, type: "SPOUSE" });

      const res = await createRelationship({
        personAId: personBId,
        personBId: personAId,
        type: "SPOUSE",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it("should reject an exact duplicate PARENT relationship", async () => {
      await createRelationship({ type: "PARENT" });
      const res = await createRelationship({ type: "PARENT" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it("should reject a logically impossible reverse PARENT (child cannot be parent's parent)", async () => {
      await createRelationship({ personAId, personBId, type: "PARENT" });

      const res = await createRelationship({
        personAId: personBId,
        personBId: personAId,
        type: "PARENT",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/circular/i);
    });

    it("should allow A to be parent of B and A to be parent of C", async () => {
      await createRelationship({ personAId, personBId, type: "PARENT" });
      const res = await createRelationship({
        personAId,
        personBId: personCId,
        type: "PARENT",
      });

      expect(res.status).toBe(201);
    });

    it("should allow A to be parent of C and B to be parent of C (two parents)", async () => {
      await createRelationship({
        personAId,
        personBId: personCId,
        type: "PARENT",
      });
      const res = await createRelationship({
        personAId: personBId,
        personBId: personCId,
        type: "PARENT",
      });

      expect(res.status).toBe(201);
    });

    it("should allow A-B SPOUSE and A-B PARENT as separate relationships", async () => {
      await createRelationship({ type: "SPOUSE" });
      const res = await createRelationship({ type: "PARENT" });

      expect(res.status).toBe(201);
    });

    it("should reject an invalid relationship type", async () => {
      const res = await createRelationship({ type: "SIBLING" });

      expect(res.status).toBe(400);
    });

    it("should reject missing personAId", async () => {
      const res = await createRelationship({ personAId: undefined });

      expect(res.status).toBe(400);
    });

    it("should reject missing personBId", async () => {
      const res = await createRelationship({ personBId: undefined });

      expect(res.status).toBe(400);
    });

    it("should reject non-UUID personAId", async () => {
      const res = await createRelationship({ personAId: "not-a-uuid" });

      expect(res.status).toBe(400);
    });

    it("should reject missing type", async () => {
      const res = await createRelationship({ type: undefined });

      expect(res.status).toBe(400);
    });

    it("should not allow unauthenticated users to create a relationship", async () => {
      const res = await request(app)
        .post(`/api/trees/${treeId}/relationships`)
        .send({ personAId, personBId, type: "SPOUSE" });

      expect(res.status).toBe(401);
    });

    it("should not allow a user to create a relationship in another user's tree", async () => {
      const otherUser = createUserAgent();
      await otherUser.register();
      await otherUser.login();

      const res = await createRelationship({}, otherUser.agent, treeId);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|permission/i);
    });

    it("should not allow creating circular relationships through multiple steps", async () => {
      // A -> B -> C -> A would be circular. Create A->B and B->C, then try to create C->A.
      await createRelationship({
        personAId,
        personBId,
        type: "PARENT",
      });
      await createRelationship({
        personAId: personBId,
        personBId: personCId,
        type: "PARENT",
      });

      const res = await createRelationship({
        personAId: personCId,
        personBId: personAId,
        type: "PARENT",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/circular/i);
    });
  });

  describe("GET /api/trees/:treeId/relationships", () => {
    it("should return all relationships in the tree", async () => {
      await createRelationship({ type: "SPOUSE" });
      await createRelationship({
        personAId,
        personBId: personCId,
        type: "PARENT",
      });

      const res = await user.agent.get(`/api/trees/${treeId}/relationships`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveLength(2);
    });

    it("should return an empty list when there are no relationships", async () => {
      const res = await user.agent.get(`/api/trees/${treeId}/relationships`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("should only return relationships from the requested tree", async () => {
      const tree2Res = await user.agent
        .post("/api/trees")
        .send({ name: "Other Tree" });
      const tree2Id = tree2Res.body.data.id;

      const personInTree2A = await user.agent
        .post(`/api/trees/${tree2Id}/persons`)
        .send({ firstName: "Dave", lastName: "Smith" });
      const personInTree2B = await user.agent
        .post(`/api/trees/${tree2Id}/persons`)
        .send({ firstName: "Eve", lastName: "Smith" });

      await createRelationship({ type: "SPOUSE" });
      await user.agent.post(`/api/trees/${tree2Id}/relationships`).send({
        personAId: personInTree2A.body.data.id,
        personBId: personInTree2B.body.data.id,
        type: "SPOUSE",
      });

      const res = await user.agent.get(`/api/trees/${treeId}/relationships`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("should return id, personAId, personBId, type — no internal fields", async () => {
      await createRelationship({ type: "SPOUSE" });

      const res = await user.agent.get(`/api/trees/${treeId}/relationships`);
      const rel = res.body.data[0];

      expect(rel.id).toBeDefined();
      expect(rel.personAId).toBeDefined();
      expect(rel.personBId).toBeDefined();
      expect(rel.type).toBeDefined();
      expect(rel.createdAt).toBeUndefined();
      expect(rel.updatedAt).toBeUndefined();
      expect(rel.treeId).toBeUndefined();
    });

    it("should not allow unauthenticated users to list relationships", async () => {
      const res = await request(app).get(`/api/trees/${treeId}/relationships`);

      expect(res.status).toBe(401);
    });

    it("should not allow a user to list relationships in another user's tree", async () => {
      const otherUser = createUserAgent();
      await otherUser.register();
      await otherUser.login();

      const res = await otherUser.agent.get(
        `/api/trees/${treeId}/relationships`,
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|permission/i);
    });
  });

  describe("GET /api/trees/:treeId/relationships/:id", () => {
    it("should get a specific relationship by ID", async () => {
      const created = await createRelationship({ type: "SPOUSE" });
      const relId = created.body.data.id;

      const res = await user.agent.get(
        `/api/trees/${treeId}/relationships/${relId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.id).toBe(relId);
      expect([res.body.data.personAId, res.body.data.personBId]).toContain(
        personAId,
      );
      expect([res.body.data.personAId, res.body.data.personBId]).toContain(
        personBId,
      );
      expect(res.body.data.type).toBe("SPOUSE");
    });

    it("should return only id, personAId, personBId, type — no internal fields", async () => {
      const created = await createRelationship({ type: "SPOUSE" });
      const relId = created.body.data.id;

      const res = await user.agent.get(
        `/api/trees/${treeId}/relationships/${relId}`,
      );

      const rel = res.body.data;
      expect(rel.id).toBeDefined();
      expect(rel.personAId).toBeDefined();
      expect(rel.personBId).toBeDefined();
      expect(rel.type).toBeDefined();
      expect(rel.createdAt).toBeUndefined();
      expect(rel.updatedAt).toBeUndefined();
      expect(rel.treeId).toBeUndefined();
    });

    it("should return 404 for a non-existent relationship ID", async () => {
      const res = await user.agent.get(
        `/api/trees/${treeId}/relationships/${randomUUID()}`,
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it("should not allow fetching a relationship from another user's tree", async () => {
      const otherUser = createUserAgent();
      await otherUser.register();
      await otherUser.login();

      const created = await createRelationship({ type: "SPOUSE" });
      const relId = created.body.data.id;

      const res = await otherUser.agent.get(
        `/api/trees/${treeId}/relationships/${relId}`,
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|permission/i);
    });

    it("should not allow fetching a relationship using the wrong tree", async () => {
      const tree2Res = await user.agent
        .post("/api/trees")
        .send({ name: "Other Tree" });
      const tree2Id = tree2Res.body.data.id;

      const created = await createRelationship({ type: "SPOUSE" });
      const relId = created.body.data.id;

      const res = await user.agent.get(
        `/api/trees/${tree2Id}/relationships/${relId}`,
      );

      expect(res.status).toBe(404);
    });

    it("should not allow unauthenticated users to fetch a relationship", async () => {
      const created = await createRelationship({ type: "SPOUSE" });
      const relId = created.body.data.id;

      const res = await request(app).get(
        `/api/trees/${treeId}/relationships/${relId}`,
      );

      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/trees/:treeId/relationships/:id", () => {
    let relId: string;

    beforeEach(async () => {
      const created = await createRelationship({ type: "SPOUSE" });
      relId = created.body.data.id;
    });

    async function updateRelationship(
      id: string,
      body: Record<string, unknown>,
      agent = user.agent,
      tree = treeId,
    ) {
      return agent.put(`/api/trees/${tree}/relationships/${id}`).send(body);
    }

    it("should update the relationship type", async () => {
      const res = await updateRelationship(relId, {
        personAId,
        personBId,
        type: "PARENT",
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.type).toBe("PARENT");
    });

    it("should update personAId", async () => {
      const res = await updateRelationship(relId, {
        personAId: personCId,
        personBId,
        type: "SPOUSE",
      });

      expect(res.status).toBe(200);
      expect([res.body.data.personAId, res.body.data.personBId]).toContain(
        personCId,
      );
      expect([res.body.data.personAId, res.body.data.personBId]).toContain(
        personBId,
      );
    });

    it("should update personBId", async () => {
      const res = await updateRelationship(relId, {
        personAId,
        personBId: personCId,
        type: "SPOUSE",
      });

      expect(res.status).toBe(200);
      expect([res.body.data.personAId, res.body.data.personBId]).toContain(
        personAId,
      );
      expect([res.body.data.personAId, res.body.data.personBId]).toContain(
        personCId,
      );
    });

    it("should persist the update in the database", async () => {
      await updateRelationship(relId, { personAId, personBId, type: "PARENT" });

      const rel = await prisma.relationship.findUnique({
        where: { id: relId },
      });
      expect(rel!.type).toBe("PARENT");
    });

    it("should return id, personAId, personBId, type — no internal fields", async () => {
      const res = await updateRelationship(relId, {
        personAId,
        personBId,
        type: "PARENT",
      });

      const rel = res.body.data;
      expect(rel.id).toBeDefined();
      expect(rel.personAId).toBeDefined();
      expect(rel.personBId).toBeDefined();
      expect(rel.type).toBeDefined();
      expect(rel.createdAt).toBeUndefined();
      expect(rel.updatedAt).toBeUndefined();
      expect(rel.treeId).toBeUndefined();
    });

    it("should allow updating to the same values (no-op update)", async () => {
      const res = await updateRelationship(relId, {
        personAId,
        personBId,
        type: "SPOUSE",
      });

      expect(res.status).toBe(200);
    });

    it("should reject a self-relationship", async () => {
      const res = await updateRelationship(relId, {
        personAId,
        personBId: personAId,
        type: "SPOUSE",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/relationship with themselves/i);
    });

    it("should reject if personA does not belong to the tree", async () => {
      const res = await updateRelationship(relId, {
        personAId: randomUUID(),
        personBId,
        type: "SPOUSE",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/belong to the same tree/i);
    });

    it("should reject if personB does not belong to the tree", async () => {
      const res = await updateRelationship(relId, {
        personAId,
        personBId: randomUUID(),
        type: "SPOUSE",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/belong to the same tree/i);
    });

    it("should reject an invalid relationship type", async () => {
      const res = await updateRelationship(relId, {
        personAId,
        personBId,
        type: "SIBLING",
      });

      expect(res.status).toBe(400);
    });

    it("should reject missing personAId", async () => {
      const res = await updateRelationship(relId, {
        personBId,
        type: "SPOUSE",
      });

      expect(res.status).toBe(400);
    });

    it("should reject missing personBId", async () => {
      const res = await updateRelationship(relId, {
        personAId,
        type: "SPOUSE",
      });

      expect(res.status).toBe(400);
    });

    it("should reject missing type", async () => {
      const res = await updateRelationship(relId, { personAId, personBId });

      expect(res.status).toBe(400);
    });

    it("should reject update if resulting relationship already exists", async () => {
      // First: A-B SPOUSE (relId). Second: A-C SPOUSE.
      // Try to update second to match first.
      const second = await createRelationship({
        personAId,
        personBId: personCId,
        type: "SPOUSE",
      });

      const res = await updateRelationship(second.body.data.id, {
        personAId,
        personBId,
        type: "SPOUSE",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it("should reject update if resulting SPOUSE relationship is a reverse duplicate", async () => {
      // First: A-B SPOUSE (relId). Second: A-C SPOUSE.
      // Try to update second to B-A SPOUSE (reverse of first).
      const second = await createRelationship({
        personAId,
        personBId: personCId,
        type: "SPOUSE",
      });

      const res = await updateRelationship(second.body.data.id, {
        personAId: personBId,
        personBId: personAId,
        type: "SPOUSE",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it("should reject logically impossible reverse PARENT on update", async () => {
      // A is parent of B. Create a separate C-B PARENT, then try to update it to B-A PARENT.
      await createRelationship({ personAId, personBId, type: "PARENT" });

      const other = await createRelationship({
        personAId: personCId,
        personBId,
        type: "PARENT",
      });

      const res = await updateRelationship(other.body.data.id, {
        personAId: personBId,
        personBId: personAId,
        type: "PARENT",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/circular/i);
    });

    it("should return 404 for a non-existent relationship ID", async () => {
      const res = await updateRelationship(randomUUID(), {
        personAId,
        personBId,
        type: "SPOUSE",
      });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it("should not allow updating a relationship using the wrong tree", async () => {
      const tree2Res = await user.agent
        .post("/api/trees")
        .send({ name: "Other Tree" });
      const tree2Id = tree2Res.body.data.id;

      const res = await updateRelationship(
        relId,
        { personAId, personBId, type: "SPOUSE" },
        user.agent,
        tree2Id,
      );

      expect(res.status).toBe(404);
    });

    it("should not allow unauthenticated users to update a relationship", async () => {
      const res = await request(app)
        .put(`/api/trees/${treeId}/relationships/${relId}`)
        .send({ personAId, personBId, type: "SPOUSE" });

      expect(res.status).toBe(401);
    });

    it("should not allow a user to update a relationship in another user's tree", async () => {
      const otherUser = createUserAgent();
      await otherUser.register();
      await otherUser.login();

      const res = await updateRelationship(
        relId,
        { personAId, personBId, type: "SPOUSE" },
        otherUser.agent,
        treeId,
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|permission/i);
    });
  });

  describe("DELETE /api/trees/:treeId/relationships/:id", () => {
    let relId: string;

    beforeEach(async () => {
      const created = await createRelationship({ type: "SPOUSE" });
      relId = created.body.data.id;
    });

    it("should delete a relationship", async () => {
      const res = await user.agent.delete(
        `/api/trees/${treeId}/relationships/${relId}`,
      );

      expect(res.status).toBe(204);

      const rel = await prisma.relationship.findUnique({
        where: { id: relId },
      });
      expect(rel).toBeNull();
    });

    it("should return 404 for a non-existent relationship", async () => {
      const res = await user.agent.delete(
        `/api/trees/${treeId}/relationships/${randomUUID()}`,
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it("should return 400 for an invalid relationship ID format", async () => {
      const res = await user.agent.delete(
        `/api/trees/${treeId}/relationships/not-a-uuid`,
      );

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid|uuid/i);
    });

    it("should not allow deleting a relationship using the wrong tree", async () => {
      const tree2Res = await user.agent
        .post("/api/trees")
        .send({ name: "Other Tree" });
      const tree2Id = tree2Res.body.data.id;

      const res = await user.agent.delete(
        `/api/trees/${tree2Id}/relationships/${relId}`,
      );

      expect(res.status).toBe(404);

      const rel = await prisma.relationship.findUnique({
        where: { id: relId },
      });
      expect(rel).not.toBeNull();
    });

    it("should not allow unauthenticated users to delete a relationship", async () => {
      const res = await request(app).delete(
        `/api/trees/${treeId}/relationships/${relId}`,
      );

      expect(res.status).toBe(401);
    });

    it("should not allow a user to delete a relationship in another user's tree", async () => {
      const otherUser = createUserAgent();
      await otherUser.register();
      await otherUser.login();

      const res = await otherUser.agent.delete(
        `/api/trees/${treeId}/relationships/${relId}`,
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|permission/i);

      const rel = await prisma.relationship.findUnique({
        where: { id: relId },
      });
      expect(rel).not.toBeNull();
    });
  });
});
