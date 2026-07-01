import request from "supertest";
import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { app } from "../server.js";
import { prisma } from "../config/db.js";
import { createUserAgent } from "./helpers/auth.js";

describe("Auth", () => {
  const buildUser = () => ({
    email: `auth-${randomUUID()}@example.com`,
    password: "password123",
    name: "Test User",
  });

  it("signs up with email and password", async () => {
    const userData = buildUser();

    const res = await request(app)
      .post("/api/auth/sign-up/email")
      .send(userData);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(userData.email);
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers["set-cookie"]).toBeDefined();

    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    expect(user).not.toBeNull();
  });

  it("rejects duplicate email signup", async () => {
    const userData = buildUser();
    await request(app).post("/api/auth/sign-up/email").send(userData);

    const res = await request(app)
      .post("/api/auth/sign-up/email")
      .send(userData);

    expect(res.status).toBe(422);
  });

  it("signs in with email and password", async () => {
    const userData = buildUser();
    await request(app).post("/api/auth/sign-up/email").send(userData);

    const res = await request(app).post("/api/auth/sign-in/email").send({
      email: userData.email,
      password: userData.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(userData.email);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects incorrect email/password login", async () => {
    const userData = buildUser();
    await request(app).post("/api/auth/sign-up/email").send(userData);

    const res = await request(app).post("/api/auth/sign-in/email").send({
      email: userData.email,
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated private routes", async () => {
    const res = await request(app).get("/api/trees");

    expect(res.status).toBe(401);
  });

  it("creates trees with the Better Auth user id as ownerId", async () => {
    const user = createUserAgent();
    await user.register();

    const res = await user.agent.post("/api/trees").send({ name: "My Tree" });

    expect(res.status).toBe(201);
    expect(res.body.data.ownerId).toBe(user.id);
  });

  it("prevents one user from accessing another user's tree", async () => {
    const userA = createUserAgent();
    await userA.register();
    const created = await userA.agent
      .post("/api/trees")
      .send({ name: "A Tree" });

    const userB = createUserAgent();
    await userB.register();

    const res = await userB.agent.get(`/api/trees/${created.body.data.id}`);

    expect(res.status).toBe(404);
  });

  it("signs out and rejects private access afterward", async () => {
    const user = createUserAgent();
    await user.register();

    const signOut = await user.logout();
    expect(signOut.status).toBe(200);

    const res = await user.agent.get("/api/trees");
    expect(res.status).toBe(401);
  });
});
