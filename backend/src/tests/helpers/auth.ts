import request from "supertest";
import { app } from "../../server.js";
import { randomUUID } from "crypto";

/**
 * Helper function to create a user agent for testing authenticated routes.
 * It signs up and signs in through Better Auth and maintains cookies across requests.
 *
 * @param {Object} userOverrides - Optional overrides for the default user properties (email, password, name).
 * @returns {Object} An object containing the agent, user details, and methods to register and log in.
 */
export function createUserAgent(
  userOverrides: Partial<{
    email: string;
    password: string;
    name: string;
  }> = {},
) {
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
    id: undefined as string | undefined,
    async register() {
      const res = await agent.post("/api/auth/sign-up/email").send(user);
      this.id = res.body.user?.id;
      return res;
    },
    async login() {
      const res = await agent.post("/api/auth/sign-in/email").send({
        email: user.email,
        password: user.password,
      });
      this.id = res.body.user?.id ?? this.id;
      return res;
    },
    async logout() {
      return agent.post("/api/auth/sign-out");
    },
  };
}
