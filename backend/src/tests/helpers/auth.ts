import request from "supertest";
import { app } from "../../server.js";
import { randomUUID } from "crypto";

/**
 * Helper function to create a user agent for testing authenticated routes. It provides methods to register and log in a user, and maintains the session across requests.
 *
 * @param {Object} userOverrides - Optional overrides for the default user properties (email, password, name).
 * @returns {Object} An object containing the agent, user details, and methods to register and log in.
 */
export function createUserAgent(userOverrides = {}) {
  const agent = request.agent(app);

  const user = {
    email: `test-${randomUUID()}@example.com`,
    password: "password123",
    name: "Test User",
    ...userOverrides,
  };

  return {
    agent,
    user,
    async register() {
      await agent.post("/api/auth/register").send(user);
    },
    async login() {
      await agent.post("/api/auth/login").send({
        email: user.email,
        password: user.password,
      });
    },
  };
}
