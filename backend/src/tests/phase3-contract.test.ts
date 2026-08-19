import { randomUUID } from "crypto";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import { toPersonDto } from "../dtos/personDto.js";
import { toRelationshipDto } from "../dtos/relationshipDto.js";
import { toTreeDto } from "../dtos/treeDto.js";
import { translateRelationshipRequest } from "../services/relationshipService.js";
import { createUserAgent } from "./helpers/auth.js";

const assertNoForbiddenKeys = (value: unknown): void => {
  if (Array.isArray(value)) {
    value.forEach(assertNoForbiddenKeys);
    return;
  }
  if (typeof value !== "object" || value === null) return;

  const forbidden = new Set([
    "ownerId",
    "normalizedName",
    "treeId",
    "token",
    "accessToken",
    "refreshToken",
    "idToken",
    "password",
    "accounts",
    "sessions",
    "verification",
  ]);
  for (const [key, child] of Object.entries(value)) {
    expect(forbidden.has(key), `forbidden response key: ${key}`).toBe(false);
    assertNoForbiddenKeys(child);
  }
};

describe("Phase 3 DTO and endpoint contract", () => {
  let user: ReturnType<typeof createUserAgent>;
  let treeId: string;

  beforeEach(async () => {
    user = createUserAgent();
    await user.register();
    const tree = await user.agent.post("/api/trees").send({ name: "Contract" });
    treeId = tree.body.data.id;
  });

  it("maps exact DTO keys", () => {
    const now = new Date("2026-01-02T03:04:05.000Z");
    expect(toTreeDto({ id: "t", name: "T", description: null, createdAt: now, updatedAt: now })).toEqual({
      id: "t", name: "T", description: null,
      createdAt: now.toISOString(), updatedAt: now.toISOString(),
    });
    const personSource = { id: "p", firstName: "A", lastName: null, gender: "UNKNOWN" as const, birthDate: null, birthDatePrecision: null, deathDate: null, deathDatePrecision: null, birthPlace: null, biography: null, treeId: "secret", createdAt: now };
    expect(toPersonDto(personSource)).not.toHaveProperty("treeId");
    const relationshipSource = { id: "r", personAId: "a", personBId: "b", type: "SPOUSE" as const, treeId: "secret", updatedAt: now };
    expect(toRelationshipDto(relationshipSource)).toEqual({ id: "r", personAId: "a", personBId: "b", type: "SPOUSE" });
  });

  it("translates all relationship input values", () => {
    expect(translateRelationshipRequest({ personAId: "b", personBId: "a", relation: "PARENT" })).toEqual({ personAId: "b", personBId: "a", type: "PARENT_CHILD" });
    expect(translateRelationshipRequest({ personAId: "a", personBId: "b", relation: "CHILD" })).toEqual({ personAId: "b", personBId: "a", type: "PARENT_CHILD" });
    expect(translateRelationshipRequest({ personAId: "b", personBId: "a", relation: "SPOUSE" })).toEqual({ personAId: "b", personBId: "a", type: "SPOUSE" });
  });

  it("returns an exact empty /full response", async () => {
    const response = await user.agent.get(`/api/trees/${treeId}/full`);
    expect(response.status).toBe(200);
    expect(response.body.data.people).toEqual([]);
    expect(response.body.data.relationships).toEqual([]);
    expect(Object.keys(response.body.data.tree).sort()).toEqual(["id", "name", "description", "createdAt", "updatedAt"].sort());
  });

  it("updates tree metadata through PATCH with the canonical DTO", async () => {
    const response = await user.agent.patch(`/api/trees/${treeId}`).send({
      name: "Updated Contract",
      description: "Updated",
    });
    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("Updated Contract");
    expect(Object.keys(response.body.data).sort()).toEqual(
      ["id", "name", "description", "createdAt", "updatedAt"].sort(),
    );
  });

  it("does not mount retired or excluded endpoints", async () => {
    const id = randomUUID();
    const checks = await Promise.all([
      user.agent.get(`/api/trees/${treeId}/persons`),
      user.agent.post(`/api/trees/${treeId}/persons`).send({ firstName: "No" }),
      user.agent.get(`/api/trees/${treeId}/graph`),
      user.agent.get(`/api/trees/${treeId}/people`),
      user.agent.get(`/api/trees/${treeId}/people/${id}`),
      user.agent.put(`/api/trees/${treeId}/people/${id}`).send({ firstName: "No" }),
      user.agent.get(`/api/trees/${treeId}/relationships`),
      user.agent.get(`/api/trees/${treeId}/relationships/${id}`),
      user.agent.put(`/api/trees/${treeId}/relationships/${id}`).send({}),
      user.agent.patch(`/api/trees/${treeId}/relationships/${id}`).send({}),
    ]);
    expect(checks.every((response) => response.status === 404)).toBe(true);
  });

  it("scopes nested mutations to the validated tree", async () => {
    const second = await user.agent.post("/api/trees").send({ name: "Second" });
    const person = await user.agent.post(`/api/trees/${treeId}/people`).send({ firstName: "A" });
    expect((await user.agent.patch(`/api/trees/${second.body.data.id}/people/${person.body.data.id}`).send({ firstName: "No" })).status).toBe(404);
    expect((await user.agent.delete(`/api/trees/${second.body.data.id}/people/${person.body.data.id}`)).status).toBe(404);
  });

  it("rejects unauthenticated relationship requests", async () => {
    const response = await request(app)
      .post(`/api/trees/${treeId}/relationships`)
      .send({ personAId: randomUUID(), personBId: randomUUID(), relation: "SPOUSE" });
    expect(response.status).toBe(401);
  });

  it("isolates every tree, person, and relationship operation by owner", async () => {
    const first = await user.agent.post(`/api/trees/${treeId}/people`).send({ firstName: "A" });
    const second = await user.agent.post(`/api/trees/${treeId}/people`).send({ firstName: "B" });
    const relationship = await user.agent.post(`/api/trees/${treeId}/relationships`).send({
      personAId: first.body.data.id,
      personBId: second.body.data.id,
      relation: "SPOUSE",
    });
    const other = createUserAgent();
    await other.register();

    const responses = await Promise.all([
      other.agent.get(`/api/trees/${treeId}`),
      other.agent.patch(`/api/trees/${treeId}`).send({ name: "No" }),
      other.agent.get(`/api/trees/${treeId}/full`),
      other.agent.post(`/api/trees/${treeId}/people`).send({ firstName: "No" }),
      other.agent.patch(`/api/trees/${treeId}/people/${first.body.data.id}`).send({ firstName: "No" }),
      other.agent.delete(`/api/trees/${treeId}/people/${first.body.data.id}`),
      other.agent.post(`/api/trees/${treeId}/relationships`).send({
        personAId: first.body.data.id,
        personBId: second.body.data.id,
        relation: "PARENT",
      }),
      other.agent.delete(`/api/trees/${treeId}/relationships/${relationship.body.data.id}`),
    ]);
    expect(responses.every((response) => response.status === 404)).toBe(true);
  });

  it("recursively excludes internal and authentication fields", async () => {
    const first = await user.agent.post(`/api/trees/${treeId}/people`).send({ firstName: "A" });
    const second = await user.agent.post(`/api/trees/${treeId}/people`).send({ firstName: "B" });
    await user.agent.post(`/api/trees/${treeId}/relationships`).send({
      personAId: first.body.data.id,
      personBId: second.body.data.id,
      relation: "PARENT",
    });
    const response = await user.agent.get(`/api/trees/${treeId}/full`);
    expect(response.status).toBe(200);
    assertNoForbiddenKeys(response.body);
    for (const person of response.body.data.people) {
      expect(Object.keys(person).sort()).toEqual(
        ["id", "firstName", "lastName", "gender", "birthDate", "birthDatePrecision", "deathDate", "deathDatePrecision", "birthPlace", "biography"].sort(),
      );
    }
    for (const relation of response.body.data.relationships) {
      expect(Object.keys(relation).sort()).toEqual(["id", "personAId", "personBId", "type"].sort());
    }
  });
});
