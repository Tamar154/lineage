import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../config/db.js";
import { createUserAgent } from "./helpers/auth.js";

describe("Phase 3 relationship contract", () => {
  let user: ReturnType<typeof createUserAgent>;
  let treeId: string;
  let a: string;
  let b: string;

  beforeEach(async () => {
    user = createUserAgent();
    await user.register();
    const tree = await user.agent.post("/api/trees").send({ name: "Relations" });
    treeId = tree.body.data.id;
    a = (await user.agent.post(`/api/trees/${treeId}/people`).send({ firstName: "A" })).body.data.id;
    b = (await user.agent.post(`/api/trees/${treeId}/people`).send({ firstName: "B" })).body.data.id;
  });

  const create = (body: Record<string, unknown>) =>
    user.agent.post(`/api/trees/${treeId}/relationships`).send(body);

  it("converts PARENT without sorting IDs", async () => {
    const response = await create({ personAId: b, personBId: a, relation: "PARENT" });
    expect(response.status).toBe(201);
    expect(response.body).not.toHaveProperty("status");
    expect(response.body.data).toEqual({
      id: expect.any(String), personAId: b, personBId: a, type: "PARENT_CHILD",
    });
  });

  it("converts CHILD by swapping parent and child", async () => {
    const response = await create({ personAId: a, personBId: b, relation: "CHILD" });
    expect(response.body.data).toMatchObject({ personAId: b, personBId: a, type: "PARENT_CHILD" });
  });

  it("normalizes spouse pairs and rejects a reverse duplicate", async () => {
    const first = await create({ personAId: b, personBId: a, relation: "SPOUSE" });
    expect(first.status).toBe(201);
    expect(first.body.data.personAId < first.body.data.personBId).toBe(true);
    const duplicate = await create({ personAId: a, personBId: b, relation: "SPOUSE" });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("RELATIONSHIP_ALREADY_EXISTS");
  });

  it("rejects persistence fields and unknown fields", async () => {
    expect((await create({ personAId: a, personBId: b, type: "SPOUSE" })).status).toBe(400);
    expect((await create({ personAId: a, personBId: b, relation: "SPOUSE", treeId })).status).toBe(400);
  });

  it("rejects cross-tree participants and cross-owner mutation", async () => {
    const otherTree = await user.agent.post("/api/trees").send({ name: "Other" });
    const otherPerson = await user.agent.post(`/api/trees/${otherTree.body.data.id}/people`).send({ firstName: "Other" });
    const outsideTree = await create({ personAId: a, personBId: otherPerson.body.data.id, relation: "SPOUSE" });
    expect(outsideTree.status).toBe(404);
    expect(outsideTree.body.error.code).toBe("PERSON_NOT_IN_TREE");
    const otherOwner = createUserAgent();
    await otherOwner.register();
    expect((await otherOwner.agent.post(`/api/trees/${treeId}/relationships`).send({
      personAId: a, personBId: b, relation: "SPOUSE",
    })).status).toBe(404);
  });

  it("deletes only the relationship with an empty 204", async () => {
    const relationship = await create({ personAId: a, personBId: b, relation: "SPOUSE" });
    const secondTree = await user.agent.post("/api/trees").send({ name: "Deletion scope" });
    expect((await user.agent.delete(`/api/trees/${secondTree.body.data.id}/relationships/${relationship.body.data.id}`)).status).toBe(404);
    const response = await user.agent.delete(`/api/trees/${treeId}/relationships/${relationship.body.data.id}`);
    expect(response.status).toBe(204);
    expect(response.text).toBe("");
    expect(await prisma.person.count({ where: { id: { in: [a, b] } } })).toBe(2);
  });

  it("returns populated full-tree DTOs", async () => {
    await create({ personAId: a, personBId: b, relation: "PARENT" });
    const full = await user.agent.get(`/api/trees/${treeId}/full`);
    expect(full.status).toBe(200);
    expect(Object.keys(full.body.data).sort()).toEqual(["tree", "people", "relationships"].sort());
    expect(full.body.data).not.toHaveProperty("persons");
    expect(full.body.data.people).toHaveLength(2);
    expect(full.body.data.relationships[0]).toEqual({
      id: expect.any(String), personAId: a, personBId: b, type: "PARENT_CHILD",
    });
  });
});
