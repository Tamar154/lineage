import { describe, it, expect, beforeEach } from "vitest";
import { createUserAgent } from "./helpers/auth.js";
import { prisma } from "../config/db.js";
import request from "supertest";
import { app } from "../server.js";
import { randomUUID } from "crypto";

describe("Person", () => {
  let user: ReturnType<typeof createUserAgent>;
  let treeId: string;

  beforeEach(async () => {
    user = createUserAgent();
    await user.register();
    await user.login();

    // Create a tree to work with
    const treeRes = await user.agent
      .post("/api/trees")
      .send({ name: "Test Tree" });
    treeId = treeRes.body.data.id;
  });

  // Helpers
  const validPerson = {
    firstName: "Alice",
    lastName: "Smith",
    birthDate: "1990-05-15",
    deathDate: null,
    bio: "Some bio",
  };

  async function createPerson(
    overrides = {},
    agent = user.agent,
    tree = treeId,
  ) {
    return agent
      .post(`/api/trees/${tree}/persons`)
      .send({ ...validPerson, ...overrides });
  }

  describe("POST /api/trees/:treeId/persons", () => {
    it("should create a person in the correct tree", async () => {
      const res = await createPerson();

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.firstName).toBe(validPerson.firstName);
      expect(res.body.data.lastName).toBe(validPerson.lastName);

      // Verify in DB
      const person = await prisma.person.findUnique({
        where: { id: res.body.data.id },
      });
      expect(person).not.toBeNull();
      expect(person!.treeId).toBe(treeId);
    });

    it("should create a person with only required fields", async () => {
      const res = await createPerson({
        birthDate: undefined,
        deathDate: undefined,
        bio: undefined,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.birthDate).toBeNull();
      expect(res.body.data.deathDate).toBeNull();
      expect(res.body.data.bio).toBeNull();
    });

    it("should create a person with all optional fields", async () => {
      const res = await createPerson({
        birthDate: "1990-01-01",
        deathDate: "2020-01-01",
        bio: "A full biography",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.birthDate).toBeDefined();
      expect(res.body.data.deathDate).toBeDefined();
      expect(res.body.data.bio).toBe("A full biography");
    });

    it("should not allow unauthenticated users to create a person", async () => {
      const res = await request(app)
        .post(`/api/trees/${treeId}/persons`)
        .send(validPerson);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not authorized|unauthorized/i);
    });

    it("should not allow creating a person in another user's tree", async () => {
      const otherUser = createUserAgent();
      await otherUser.register();
      await otherUser.login();

      const res = await createPerson({}, otherUser.agent, treeId);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|permission/i);
    });

    it("should not allow creating a person in a non-existent tree", async () => {
      const res = await createPerson({}, user.agent, randomUUID());

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|permission/i);
    });

    it("should fail when firstName is missing", async () => {
      const res = await createPerson({ firstName: undefined });

      expect(res.status).toBe(400);
    });

    it("should fail when lastName is missing", async () => {
      const res = await createPerson({ lastName: undefined });

      expect(res.status).toBe(400);
    });

    it("should fail when firstName is empty string", async () => {
      const res = await createPerson({ firstName: "" });

      expect(res.status).toBe(400);
    });

    it("should fail when lastName is empty string", async () => {
      const res = await createPerson({ lastName: "" });

      expect(res.status).toBe(400);
    });

    it("should fail when birthDate is in the future", async () => {
      const res = await createPerson({ birthDate: "2099-01-01" });

      expect(res.status).toBe(400);
    });

    it("should fail when deathDate is in the future", async () => {
      const res = await createPerson({ deathDate: "2099-01-01" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/trees/:treeId/persons", () => {
    it("should return all persons in the tree", async () => {
      await createPerson({ firstName: "Alice" });
      await createPerson({ firstName: "Bob" });

      const res = await user.agent.get(`/api/trees/${treeId}/persons`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveLength(2);
    });

    it("should return an empty list when the tree has no persons", async () => {
      const res = await user.agent.get(`/api/trees/${treeId}/persons`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("should only return persons from the requested tree, not other trees", async () => {
      // Create a second tree with a person
      const tree2Res = await user.agent
        .post("/api/trees")
        .send({ name: "Other Tree" });
      const tree2Id = tree2Res.body.data.id;

      await createPerson({ firstName: "Alice" }, user.agent, treeId);
      await createPerson({ firstName: "Bob" }, user.agent, tree2Id);

      const res = await user.agent.get(`/api/trees/${treeId}/persons`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].firstName).toBe("Alice");
    });

    it("should not allow unauthenticated users to list persons", async () => {
      const res = await request(app).get(`/api/trees/${treeId}/persons`);

      expect(res.status).toBe(401);
    });

    it("should not allow a user to list persons in another user's tree", async () => {
      const otherUser = createUserAgent();
      await otherUser.register();
      await otherUser.login();

      const res = await otherUser.agent.get(`/api/trees/${treeId}/persons`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|permission/i);
    });
  });

  describe("GET /api/trees/:treeId/persons/:id", () => {
    it("should get a specific person by ID", async () => {
      const created = await createPerson();
      const personId = created.body.data.id;

      const res = await user.agent.get(
        `/api/trees/${treeId}/persons/${personId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.id).toBe(personId);
      expect(res.body.data.firstName).toBe(validPerson.firstName);
    });

    it("should return 404 for a non-existent person ID", async () => {
      const res = await user.agent.get(
        `/api/trees/${treeId}/persons/${randomUUID()}`,
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it("should return 400 for an invalid person ID format", async () => {
      const res = await user.agent.get(
        `/api/trees/${treeId}/persons/not-a-uuid`,
      );

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid|uuid/i);
    });

    it("should not allow fetching a person from another user's tree", async () => {
      const otherUser = createUserAgent();
      await otherUser.register();
      await otherUser.login();

      const created = await createPerson();
      const personId = created.body.data.id;

      const res = await otherUser.agent.get(
        `/api/trees/${treeId}/persons/${personId}`,
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|permission/i);
    });

    it("should not allow fetching a person using a different tree in the same account", async () => {
      // Person exists in treeId, but we request it via tree2Id - should 404
      const tree2Res = await user.agent
        .post("/api/trees")
        .send({ name: "Other Tree" });
      const tree2Id = tree2Res.body.data.id;

      const created = await createPerson();
      const personId = created.body.data.id;

      const res = await user.agent.get(
        `/api/trees/${tree2Id}/persons/${personId}`,
      );

      expect(res.status).toBe(404);
    });

    it("should not allow unauthenticated users to fetch a person", async () => {
      const created = await createPerson();
      const personId = created.body.data.id;

      const res = await request(app).get(
        `/api/trees/${treeId}/persons/${personId}`,
      );

      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/trees/:treeId/persons/:id", () => {
    it("should update a person's fields", async () => {
      const created = await createPerson();
      const personId = created.body.data.id;

      const res = await user.agent
        .put(`/api/trees/${treeId}/persons/${personId}`)
        .send({ ...validPerson, firstName: "Updated" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.firstName).toBe("Updated");
    });

    it("should persist the update in the database", async () => {
      const created = await createPerson();
      const personId = created.body.data.id;

      await user.agent
        .put(`/api/trees/${treeId}/persons/${personId}`)
        .send({ ...validPerson, firstName: "Persisted" });

      const person = await prisma.person.findUnique({
        where: { id: personId },
      });
      expect(person!.firstName).toBe("Persisted");
    });

    it("should return 404 for a non-existent person ID", async () => {
      const res = await user.agent
        .put(`/api/trees/${treeId}/persons/${randomUUID()}`)
        .send(validPerson);

      expect(res.status).toBe(404);
    });

    it("should return 400 for an invalid person ID format", async () => {
      const res = await user.agent
        .put(`/api/trees/${treeId}/persons/not-a-uuid`)
        .send(validPerson);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid|uuid/i);
    });

    it("should not allow updating a person in another user's tree", async () => {
      const otherUser = createUserAgent();
      await otherUser.register();
      await otherUser.login();

      const created = await createPerson();
      const personId = created.body.data.id;

      const res = await otherUser.agent
        .put(`/api/trees/${treeId}/persons/${personId}`)
        .send(validPerson);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|permission/i);
    });

    it("should not allow updating a person using the wrong tree", async () => {
      const tree2Res = await user.agent
        .post("/api/trees")
        .send({ name: "Other Tree" });
      const tree2Id = tree2Res.body.data.id;

      const created = await createPerson();
      const personId = created.body.data.id;

      const res = await user.agent
        .put(`/api/trees/${tree2Id}/persons/${personId}`)
        .send(validPerson);

      expect(res.status).toBe(404);
    });

    it("should not allow unauthenticated users to update a person", async () => {
      const created = await createPerson();
      const personId = created.body.data.id;

      const res = await request(app)
        .put(`/api/trees/${treeId}/persons/${personId}`)
        .send(validPerson);

      expect(res.status).toBe(401);
    });

    it("should fail when firstName is empty on update", async () => {
      const created = await createPerson();
      const personId = created.body.data.id;

      const res = await user.agent
        .put(`/api/trees/${treeId}/persons/${personId}`)
        .send({ ...validPerson, firstName: "" });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/trees/:treeId/persons/:id", () => {
    it("should delete a person", async () => {
      const created = await createPerson();
      const personId = created.body.data.id;

      const res = await user.agent.delete(
        `/api/trees/${treeId}/persons/${personId}`,
      );

      expect(res.status).toBe(204);

      const person = await prisma.person.findUnique({
        where: { id: personId },
      });
      expect(person).toBeNull();
    });

    it("should return 404 for a non-existent person", async () => {
      const res = await user.agent.delete(
        `/api/trees/${treeId}/persons/${randomUUID()}`,
      );

      // Prisma will throw if the record doesn't exist on delete
      expect(res.status).toBe(404);
    });

    it("should return 400 for an invalid person ID format", async () => {
      const res = await user.agent.delete(
        `/api/trees/${treeId}/persons/not-a-uuid`,
      );

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid|uuid/i);
    });

    it("should not allow deleting a person in another user's tree", async () => {
      const otherUser = createUserAgent();
      await otherUser.register();
      await otherUser.login();

      const created = await createPerson();
      const personId = created.body.data.id;

      const res = await otherUser.agent.delete(
        `/api/trees/${treeId}/persons/${personId}`,
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|permission/i);

      // Verify it's still in the DB
      const person = await prisma.person.findUnique({
        where: { id: personId },
      });
      expect(person).not.toBeNull();
    });

    it("should not allow deleting a person using the wrong tree", async () => {
      const tree2Res = await user.agent
        .post("/api/trees")
        .send({ name: "Other Tree" });
      const tree2Id = tree2Res.body.data.id;

      const created = await createPerson();
      const personId = created.body.data.id;

      const res = await user.agent.delete(
        `/api/trees/${tree2Id}/persons/${personId}`,
      );

      expect(res.status).toBe(404);

      const person = await prisma.person.findUnique({
        where: { id: personId },
      });
      expect(person).not.toBeNull();
    });

    it("should not allow unauthenticated users to delete a person", async () => {
      const created = await createPerson();
      const personId = created.body.data.id;

      const res = await request(app).delete(
        `/api/trees/${treeId}/persons/${personId}`,
      );

      expect(res.status).toBe(401);
    });
  });
});
