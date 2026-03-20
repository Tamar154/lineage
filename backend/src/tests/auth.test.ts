import request from "supertest";

import { describe, it, expect } from "vitest";
import { app } from "../server.js";
import { prisma } from "../config/db.js";

describe("Auth", () => {
  const userData = {
    email: "test@example.com",
    password: "password123",
    name: "Test User",
  };

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app).post("/api/auth/register").send(userData);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.email).toBe(userData.email);

      // Cookie should be set
      expect(res.headers["set-cookie"]).toBeDefined();

      // Verify user is in the database
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(user).not.toBeNull();
      // Password should be hashed
      expect(user?.password).not.toBe(userData.password);
      // password should not leak
      expect(res.body.data.password).toBeUndefined();
    });

    it("should not allow duplicate email registration", async () => {
      await request(app).post("/api/auth/register").send(userData);

      const res = await request(app).post("/api/auth/register").send(userData);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/email already exists/i);
    });

    it("should fail with missing email", async () => {
      const res = await request(app).post("/api/auth/register").send({
        password: userData.password,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid input/i);
    });

    it("should fail with missing password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: userData.email,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid input/i);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with correct credentials", async () => {
      // first register the user
      await request(app).post("/api/auth/register").send(userData);

      // attempt to login
      const res = await request(app).post("/api/auth/login").send({
        email: userData.email,
        password: userData.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.email).toBe(userData.email);
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should fail with incorrect password", async () => {
      await request(app).post("/api/auth/register").send(userData);

      const res = await request(app).post("/api/auth/login").send({
        email: userData.email,
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized/i);
    });

    it("should fail with incorrect email", async () => {
      await request(app).post("/api/auth/register").send(userData);

      const res = await request(app).post("/api/auth/login").send({
        email: "wrong@example.com",
        password: userData.password,
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized/i);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should clear the JWT cookie on logout", async () => {
      const res = await request(app).post("/api/auth/logout");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies).not.toContain("jwt");
    });
  });
});
