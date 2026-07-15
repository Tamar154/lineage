import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import { prisma } from "../config/db.js";
import { createUserAgent } from "./helpers/auth.js";

describe("Person V1 schema", () => {
  let user: ReturnType<typeof createUserAgent>;
  let treeId: string;

  beforeEach(async () => {
    user = createUserAgent();
    await user.register();
    await user.login();
    const tree = await user.agent.post("/api/trees").send({ name: "People" });
    treeId = tree.body.data.id;
  });

  const createPerson = (body: Record<string, unknown> = { firstName: "Tamar" }) =>
    user.agent.post(`/api/trees/${treeId}/persons`).send(body);

  it("creates a person with first name only and database defaults", async () => {
    const response = await createPerson({ firstName: "  Tamar  " });
    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      firstName: "Tamar",
      lastName: null,
      gender: "UNKNOWN",
      birthDate: null,
      birthDatePrecision: null,
      deathDate: null,
      deathDatePrecision: null,
      birthPlace: null,
      biography: null,
    });
  });

  it("normalizes optional strings and accepts every gender", async () => {
    for (const gender of ["MALE", "FEMALE", "OTHER", "UNKNOWN"]) {
      const response = await createPerson({
        firstName: gender,
        lastName: "  ",
        gender,
        birthPlace: "  Jerusalem  ",
        biography: "  Story  ",
      });
      expect(response.status).toBe(201);
      expect(response.body.data.lastName).toBeNull();
      expect(response.body.data.birthPlace).toBe("Jerusalem");
      expect(response.body.data.biography).toBe("Story");
    }
  });

  it("persists year, month, and day partial dates without invented parts", async () => {
    const cases = [["1990", "YEAR"], ["1990-02", "MONTH"], ["1990-02-10", "DAY"]];
    for (const [birthDate, birthDatePrecision] of cases) {
      const response = await createPerson({
        firstName: birthDate,
        birthDate,
        birthDatePrecision,
      });
      expect(response.status).toBe(201);
      expect(response.body.data.birthDate).toBe(birthDate);
      expect(response.body.data.birthDatePrecision).toBe(birthDatePrecision);
    }
  });

  it("rejects mismatched, impossible, and future partial dates", async () => {
    const invalid = [
      { birthDate: "1990", birthDatePrecision: "MONTH" },
      { birthDate: "2001-02-29", birthDatePrecision: "DAY" },
      { birthDate: "2999", birthDatePrecision: "YEAR" },
      { birthDate: "1990" },
    ];
    for (const fields of invalid) {
      const response = await createPerson({ firstName: "Invalid", ...fields });
      expect(response.status).toBe(400);
    }
  });

  it("rejects only conclusively death-before-birth ranges", async () => {
    const rejected = await createPerson({
      firstName: "Invalid",
      birthDate: "2000",
      birthDatePrecision: "YEAR",
      deathDate: "1999-12-31",
      deathDatePrecision: "DAY",
    });
    expect(rejected.status).toBe(400);

    const uncertain = await createPerson({
      firstName: "Allowed",
      birthDate: "2000",
      birthDatePrecision: "YEAR",
      deathDate: "2000-01",
      deathDatePrecision: "MONTH",
    });
    expect(uncertain.status).toBe(201);
  });

  it("supports partial updates and clearing both date fields", async () => {
    const created = await createPerson({
      firstName: "Original",
      lastName: "Name",
      birthDate: "1990",
      birthDatePrecision: "YEAR",
    });
    const url = `/api/trees/${treeId}/persons/${created.body.data.id}`;

    const renamed = await user.agent.put(url).send({ firstName: "Updated" });
    expect(renamed.status).toBe(200);
    expect(renamed.body.data.lastName).toBe("Name");
    expect(renamed.body.data.birthDate).toBe("1990");

    const halfClear = await user.agent.put(url).send({ birthDate: null });
    expect(halfClear.status).toBe(400);

    const cleared = await user.agent.put(url).send({
      birthDate: null,
      birthDatePrecision: null,
      lastName: "",
    });
    expect(cleared.status).toBe(200);
    expect(cleared.body.data.birthDate).toBeNull();
    expect(cleared.body.data.birthDatePrecision).toBeNull();
    expect(cleared.body.data.lastName).toBeNull();
  });

  it("enforces ownership and authentication", async () => {
    const unauthenticated = await request(app)
      .post(`/api/trees/${treeId}/persons`)
      .send({ firstName: "No" });
    expect(unauthenticated.status).toBe(401);

    const other = createUserAgent();
    await other.register();
    await other.login();
    const crossOwner = await other.agent
      .post(`/api/trees/${treeId}/persons`)
      .send({ firstName: "No" });
    expect(crossOwner.status).toBe(404);
  });

  it("allows duplicate people", async () => {
    expect((await createPerson()).status).toBe(201);
    expect((await createPerson()).status).toBe(201);
  });

  it("deletes a person and cascades both A-side and B-side relationships", async () => {
    const a = await createPerson({ firstName: "A" });
    const b = await createPerson({ firstName: "B" });
    const c = await createPerson({ firstName: "C" });
    await user.agent.post(`/api/trees/${treeId}/relationships`).send({
      personAId: a.body.data.id,
      personBId: b.body.data.id,
      type: "PARENT_CHILD",
    });
    await user.agent.post(`/api/trees/${treeId}/relationships`).send({
      personAId: c.body.data.id,
      personBId: a.body.data.id,
      type: "PARENT_CHILD",
    });

    expect((await user.agent.delete(`/api/trees/${treeId}/persons/${a.body.data.id}`)).status).toBe(204);
    expect(await prisma.relationship.count({ where: { treeId } })).toBe(0);
    expect(await prisma.person.count({ where: { treeId } })).toBe(2);
  });
});
