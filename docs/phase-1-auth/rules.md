Read the following project planning documents first:

- `docs/PRD.md`
- `docs/API.md`
- `docs/phase-1-auth-refactor.md`
- `docs/phase-1-auth-testing.md`
- `docs/phase-1-auth-checklist.md`

Your source of truth is the V1 plan in these docs. The current implementation is a learning prototype and should only be used to understand what currently exists.

Implement **Phase 1: Auth Refactor to Better Auth** only.

Scope for this task:

1. Replace the current custom auth system with Better Auth.
2. Support email/password auth.
3. Support Google login.
4. Remove runtime dependence on custom JWT auth, bcryptpassword auth, and custom auth controllers/routes.
5. Remove the custom LineAge-owned `User` model from the Prisma schema.
6. Keep `Tree.ownerId` as a plain string containing the Better Auth user ID.
7. Do not refactor `Person`, `Relationship`, `/persons`, `/graph`, share links, error response format, React Flow layout, or any other V1 feature in this task.
8. Keep the existing repository structure: `backend/` and `frontend/`.

Before coding:

- Inspect the current backend and frontend auth implementation.
- Inspect current package versions, especially Express and Prisma.
- Check the current Better Auth documentation for the correct Express, Prisma, email/password, Google, and React client setup.
- Pay special attention to Express 5 route syntax and Better Auth middleware ordering.
- Do not put `express.json()` before the Better Auth handler if Better Auth docs warn against it.
- Account for the project’s custom Prisma client output path if needed.

Implementation requirements:

- Add Better Auth backend configuration.
- Mount Better Auth under `/api/auth`.
- Add email/password auth.
- Add Google provider support.
- Add required environment variable documentation/example updates if applicable.
- Replace `verifyToken` with a Better Auth session-based auth middleware.
- Preserve temporary compatibility with existing code by attaching the authenticated user ID in the shape expected by current ownership logic, for example `req.user.id`, unless there is a better minimal-change approach.
- Update protected backend routes to use the new auth middleware.
- Update frontend register/login/logout code to use Better Auth.
- Add a Google login button/action.
- Update tests or test helpers so authenticated backend tests use Better Auth instead of the old custom auth endpoints.

Security requirements:

- Do not accept `ownerId` from the client.
- Always set `ownerId` from the authenticated Better Auth session user ID.
- Do not leave old custom auth endpoints active at runtime.
- Do not commit secrets.
- Keep CORS credential handling safe and explicit.
- Make sure Google OAuth callback configuration is documented.

Checklist requirement:

- As you complete work, update `docs/phase-1-auth-checklist.md`.
- Only check off items that are actually completed.
- If something cannot be completed, leave it unchecked and add a short note explaining why.

Validation requirement:

After implementation, verify:

- backend TypeScript compiles
- frontend TypeScript/build passes
- tests pass or clearly document which tests need follow-up
- email/password signup works
- email/password login works
- logout works
- Google login is configured
- authenticated user can create/list their own trees
- unauthenticated user cannot access private routes
- user A cannot access user B’s tree

If any required information is missing, stop and ask instead of guessing.
