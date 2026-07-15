import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../config/db.js";
import { createUserAgent } from "./helpers/auth.js";

describe("Relationship V1 schema", () => {
  let user: ReturnType<typeof createUserAgent>;
  let treeId: string;
  let a: string;
  let b: string;

  beforeEach(async () => {
    user = createUserAgent();
    await user.register();
    await user.login();
    const tree = await user.agent.post("/api/trees").send({ name: "Relations" });
    treeId = tree.body.data.id;
    a = (await user.agent.post(`/api/trees/${treeId}/persons`).send({ firstName: "A" })).body.data.id;
    b = (await user.agent.post(`/api/trees/${treeId}/persons`).send({ firstName: "B" })).body.data.id;
  });

  const create = (body: Record<string, unknown>) =>
    user.agent.post(`/api/trees/${treeId}/relationships`).send(body);

  it("preserves A=parent and B=child without sorting", async () => {
    const response = await create({ personAId: b, personBId: a, type: "PARENT_CHILD" });
    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ personAId: b, personBId: a, type: "PARENT_CHILD" });
  });

  it("normalizes spouses before persistence and duplicate lookup", async () => {
    const first = await create({ personAId: b, personBId: a, type: "SPOUSE" });
    expect(first.status).toBe(201);
    expect(first.body.data.personAId < first.body.data.personBId).toBe(true);
    const reverse = await create({ personAId: a, personBId: b, type: "SPOUSE" });
    expect(reverse.status).toBe(400);
    expect(await prisma.relationship.count({ where: { treeId, type: "SPOUSE" } })).toBe(1);
  });

  it("rejects exact directed duplicates and self relationships", async () => {
    expect((await create({ personAId: a, personBId: b, type: "PARENT_CHILD" })).status).toBe(201);
    expect((await create({ personAId: a, personBId: b, type: "PARENT_CHILD" })).status).toBe(400);
    expect((await create({ personAId: a, personBId: a, type: "SPOUSE" })).status).toBe(400);
  });

  it("rejects cross-tree and cross-owner person IDs", async () => {
    const otherTree = await user.agent.post("/api/trees").send({ name: "Other" });
    const otherPerson = await user.agent
      .post(`/api/trees/${otherTree.body.data.id}/persons`)
      .send({ firstName: "Other" });
    expect((await create({ personAId: a, personBId: otherPerson.body.data.id, type: "SPOUSE" })).status).toBe(400);

    const otherOwner = createUserAgent();
    await otherOwner.register();
    await otherOwner.login();
    expect((await otherOwner.agent.post(`/api/trees/${treeId}/relationships`).send({
      personAId: a,
      personBId: b,
      type: "SPOUSE",
    })).status).toBe(404);
  });

  it("deletes only the relationship", async () => {
    const relationship = await create({ personAId: a, personBId: b, type: "SPOUSE" });
    const response = await user.agent.delete(
      `/api/trees/${treeId}/relationships/${relationship.body.data.id}`,
    );
    expect(response.status).toBe(204);
    expect(await prisma.person.count({ where: { id: { in: [a, b] } } })).toBe(2);
  });

  it("returns the refactored relationship from the graph endpoint", async () => {
    await create({ personAId: a, personBId: b, type: "PARENT_CHILD" });
    const graph = await user.agent.get(`/api/trees/${treeId}/graph`);
    expect(graph.status).toBe(200);
    expect(graph.body.data.relationships[0]).toMatchObject({
      personAId: a,
      personBId: b,
      type: "PARENT_CHILD",
    });
  });
});
