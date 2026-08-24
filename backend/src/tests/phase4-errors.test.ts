import { randomUUID } from "crypto";
import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { errorDefinitions } from "../errors/errorDefinitions.js";
import { toValidationErrorDetails } from "../errors/validationErrorDetails.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { app } from "../server.js";
import AppError from "../utils/AppError.js";
import { createUserAgent } from "./helpers/auth.js";

const expectErrorEnvelope = (
  response: request.Response,
  status: number,
  code: string,
) => {
  expect(response.status).toBe(status);
  expect(Object.keys(response.body)).toEqual(["error"]);
  expect(Object.keys(response.body.error).sort()).toEqual(
    (Object.hasOwn(response.body.error, "details")
      ? ["code", "details", "message"]
      : ["code", "message"]),
  );
  expect(response.body.error.code).toBe(code);
  expect(response.body.error.message).toEqual(expect.any(String));
  expect(response.body).not.toHaveProperty("status");
  expect(response.body).not.toHaveProperty("message");
};

describe("Phase 4 error primitives", () => {
  it("defines every active code with its exact status and message", () => {
    expect(errorDefinitions).toEqual({
      UNAUTHENTICATED: { status: 401, message: "You must be signed in to continue." },
      FORBIDDEN: { status: 403, message: "You do not have permission to perform this action." },
      NOT_FOUND: { status: 404, message: "The requested resource was not found." },
      VALIDATION_ERROR: { status: 400, message: "Some fields are invalid." },
      TREE_NAME_ALREADY_EXISTS: { status: 409, message: "You already have a tree with this name." },
      PERSON_NOT_IN_TREE: { status: 404, message: "One or more people were not found in this tree." },
      RELATIONSHIP_ALREADY_EXISTS: { status: 409, message: "This relationship already exists." },
      MAX_SPOUSE_LIMIT_REACHED: { status: 409, message: "A person cannot have more than one spouse." },
      RELATIONSHIP_CYCLE_DETECTED: { status: 409, message: "This relationship would create a cycle." },
      INTERNAL_ERROR: { status: 500, message: "An unexpected error occurred." },
    });
  });

  it("constructs AppError from a code with optional safe overrides", () => {
    const defaultError = new AppError("NOT_FOUND");
    expect(defaultError).toBeInstanceOf(Error);
    expect(defaultError.statusCode).toBe(404);
    expect(defaultError.message).toBe(errorDefinitions.NOT_FOUND.message);

    const details = { fields: { name: "Use another name." } };
    const overridden = new AppError("VALIDATION_ERROR", {
      message: "Check this form.",
      details,
    });
    expect(overridden.statusCode).toBe(400);
    expect(overridden.message).toBe("Check this form.");
    expect(overridden.details).toEqual(details);
  });

  it("maps Zod paths, root issues, and only the first message per field", () => {
    const schema = z.object({
      name: z.string().superRefine((_value, context) => {
        context.addIssue({ code: "custom", message: "First name issue" });
        context.addIssue({ code: "custom", message: "Second name issue" });
      }),
      personId: z.string().min(2, "Person issue"),
      birthDatePrecision: z.string().min(2, "Precision issue"),
      nested: z.object({ path: z.string().min(2, "Nested issue") }),
    }).refine(() => false, "Form issue");
    const result = schema.safeParse({
      name: "x",
      personId: "x",
      birthDatePrecision: "x",
      nested: { path: "x" },
    });
    if (result.success) throw new Error("Expected schema failure");

    expect(toValidationErrorDetails(result.error)).toEqual({
      fields: {
        name: "First name issue",
        personId: "Person issue",
        birthDatePrecision: "Precision issue",
        "nested.path": "Nested issue",
      },
      formErrors: ["Form issue"],
    });
  });

  it("sanitizes unexpected errors and logs the original server-side", async () => {
    const isolatedApp = express();
    isolatedApp.get("/boom", () => {
      throw new Error("SENSITIVE_SENTINEL database path");
    });
    isolatedApp.get("/value", () => {
      throw "NON_ERROR_SENTINEL";
    });
    isolatedApp.use(errorHandler);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await request(isolatedApp).get("/boom");
    expectErrorEnvelope(response, 500, "INTERNAL_ERROR");
    expect(response.text).not.toContain("SENSITIVE_SENTINEL");
    expect(response.text).not.toContain("stack");
    const nonErrorResponse = await request(isolatedApp).get("/value");
    expectErrorEnvelope(nonErrorResponse, 500, "INTERNAL_ERROR");
    expect(nonErrorResponse.text).not.toContain("NON_ERROR_SENTINEL");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("Phase 4 LineAge route errors", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the LineAge envelope for unauthenticated and unknown routes", async () => {
    expectErrorEnvelope(await request(app).get("/api/trees"), 401, "UNAUTHENTICATED");
    expectErrorEnvelope(await request(app).get("/api/does-not-exist"), 404, "NOT_FOUND");
  });

  it("keeps Better Auth errors under Better Auth's contract", async () => {
    const user = createUserAgent();
    await user.register();
    const response = await request(app).post("/api/auth/sign-up/email").send(user.user);
    expect(response.status).toBe(422);
    expect(response.body).not.toHaveProperty("error.code");
  });

  it("maps body, form, parameter, and malformed-JSON validation safely", async () => {
    const user = createUserAgent();
    await user.register();

    const body = await user.agent.post("/api/trees").send({ name: "" });
    expectErrorEnvelope(body, 400, "VALIDATION_ERROR");
    expect(body.body.error.details).toEqual({
      fields: { name: "Tree name is required" },
    });

    const created = await user.agent.post("/api/trees").send({ name: "Validation" });
    const emptyPatch = await user.agent.patch(`/api/trees/${created.body.data.id}`).send({});
    expectErrorEnvelope(emptyPatch, 400, "VALIDATION_ERROR");
    expect(emptyPatch.body.error.details.formErrors).toEqual(["At least one field is required"]);

    const params = await user.agent.get("/api/trees/not-a-uuid");
    expectErrorEnvelope(params, 400, "VALIDATION_ERROR");
    expect(params.body.error.details.fields.treeId).toEqual(expect.any(String));

    const nestedParams = await user.agent.post("/api/trees/not-a-uuid/people").send({ firstName: "A" });
    expectErrorEnvelope(nestedParams, 400, "VALIDATION_ERROR");

    const invalidDate = await user.agent
      .post(`/api/trees/${created.body.data.id}/people`)
      .send({ firstName: "Invalid", birthDate: "1990" });
    expectErrorEnvelope(invalidDate, 400, "VALIDATION_ERROR");
    expect(invalidDate.body.error.details.formErrors[0]).toMatch(/birth date and precision/i);

    const malformed = await user.agent
      .post("/api/trees")
      .set("Content-Type", "application/json")
      .send('{"name":');
    expectErrorEnvelope(malformed, 400, "VALIDATION_ERROR");
    expect(malformed.body.error).not.toHaveProperty("details");
    expect(malformed.text).not.toContain("SyntaxError");
  });

  it("conceals private tree ownership and maps missing people", async () => {
    const owner = createUserAgent();
    await owner.register();
    const tree = await owner.agent.post("/api/trees").send({ name: "Private" });
    const other = createUserAgent();
    await other.register();

    for (const path of [
      `/api/trees/${tree.body.data.id}`,
      `/api/trees/${tree.body.data.id}/full`,
    ]) {
      const response = await other.agent.get(path);
      expectErrorEnvelope(response, 404, "NOT_FOUND");
      expect(response.text).not.toContain(owner.id);
      expect(response.text).not.toContain("ownerId");
    }

    const missing = await owner.agent
      .delete(`/api/trees/${tree.body.data.id}/people/${randomUUID()}`);
    expectErrorEnvelope(missing, 404, "NOT_FOUND");
  });

  it("maps prechecked and persistence tree-name conflicts to 409", async () => {
    const user = createUserAgent();
    await user.register();
    await user.agent.post("/api/trees").send({ name: "Duplicate" });
    const duplicate = await user.agent.post("/api/trees").send({ name: " duplicate " });
    expectErrorEnvelope(duplicate, 409, "TREE_NAME_ALREADY_EXISTS");
    expect(duplicate.text).not.toContain("P2002");

    vi.spyOn(prisma.tree, "create").mockRejectedValueOnce({ code: "P2002" });
    const raced = await user.agent.post("/api/trees").send({ name: "Race" });
    expectErrorEnvelope(raced, 409, "TREE_NAME_ALREADY_EXISTS");

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(prisma.tree, "create").mockRejectedValueOnce({
      code: "P2024",
      message: "PERSISTENCE_SENTINEL",
    });
    const unknownPersistence = await user.agent.post("/api/trees").send({ name: "Unknown failure" });
    expectErrorEnvelope(unknownPersistence, 500, "INTERNAL_ERROR");
    expect(unknownPersistence.text).not.toContain("P2024");
    expect(unknownPersistence.text).not.toContain("PERSISTENCE_SENTINEL");
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("maps current relationship validation paths without adding new rules", async () => {
    const user = createUserAgent();
    await user.register();
    const tree = await user.agent.post("/api/trees").send({ name: "Relationships" });
    const otherTree = await user.agent.post("/api/trees").send({ name: "Other tree" });
    const createPerson = async (treeId: string, firstName: string) =>
      (await user.agent.post(`/api/trees/${treeId}/people`).send({ firstName })).body.data.id as string;
    const a = await createPerson(tree.body.data.id, "A");
    const b = await createPerson(tree.body.data.id, "B");
    const c = await createPerson(tree.body.data.id, "C");
    const outside = await createPerson(otherTree.body.data.id, "Outside");
    const url = `/api/trees/${tree.body.data.id}/relationships`;

    const self = await user.agent.post(url).send({ personAId: a, personBId: a, relation: "SPOUSE" });
    expectErrorEnvelope(self, 400, "VALIDATION_ERROR");
    expect(self.body.error.details.formErrors).toHaveLength(1);

    const crossTree = await user.agent.post(url).send({ personAId: a, personBId: outside, relation: "SPOUSE" });
    expectErrorEnvelope(crossTree, 404, "PERSON_NOT_IN_TREE");

    const spouse = await user.agent.post(url).send({ personAId: a, personBId: b, relation: "SPOUSE" });
    expect(spouse.status).toBe(201);
    const reverseDuplicate = await user.agent.post(url).send({ personAId: b, personBId: a, relation: "SPOUSE" });
    expectErrorEnvelope(reverseDuplicate, 409, "RELATIONSHIP_ALREADY_EXISTS");
    const spouseLimit = await user.agent.post(url).send({ personAId: a, personBId: c, relation: "SPOUSE" });
    expectErrorEnvelope(spouseLimit, 409, "MAX_SPOUSE_LIMIT_REACHED");

    await user.agent.post(url).send({ personAId: a, personBId: c, relation: "PARENT" });
    const directCycle = await user.agent.post(url).send({ personAId: c, personBId: a, relation: "PARENT" });
    expectErrorEnvelope(directCycle, 409, "RELATIONSHIP_CYCLE_DETECTED");

    const d = await createPerson(tree.body.data.id, "D");
    const e = await createPerson(tree.body.data.id, "E");
    vi.spyOn(prisma.relationship, "create").mockRejectedValueOnce({ code: "P2002" });
    const racedDuplicate = await user.agent.post(url).send({ personAId: d, personBId: e, relation: "SPOUSE" });
    expectErrorEnvelope(racedDuplicate, 409, "RELATIONSHIP_ALREADY_EXISTS");
    expect(racedDuplicate.text).not.toContain("P2002");

    const missing = await user.agent.delete(`${url}/${randomUUID()}`);
    expectErrorEnvelope(missing, 404, "NOT_FOUND");
  }, 20_000);
});
