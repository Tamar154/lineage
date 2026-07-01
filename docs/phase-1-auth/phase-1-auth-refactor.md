# Phase 1: Auth Refactor to Better Auth

## Purpose

This document defines the first refactor phase for LineAge.

The current project was built for learning. The new source of truth is the V1 plan created for LineAge. This phase focuses only on replacing the current custom authentication system with Better Auth.

No unrelated V1 refactors should be included in this phase.

---

## Phase Goal

Replace the custom auth implementation with Better Auth while keeping the rest of the current app behavior as stable as possible.

This phase should introduce:

- Better Auth
- email/password authentication
- Google login
- Better Auth-owned auth tables
- Better Auth session-based route protection

This phase should remove runtime dependence on:

- custom `User` model with password
- bcrypt password hashing
- custom JWT generation
- custom JWT verification middleware
- custom `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` controllers

---

## Confirmed Constraints

- The database can be reset.
- Keep the current repository structure:
  - `backend/`
  - `frontend/`

- Do not move to `apps/api` or `apps/web`.
- Auth should be introduced first.
- Remove the current custom auth model from the schema.
- Do not refactor unrelated entities yet.
- Do not rename people/person routes yet.
- Do not refactor relationships yet.
- Do not add share links yet.
- Do not change the visual tree yet.

---

## Current State

The current backend has custom authentication:

- custom `User` Prisma model
- password stored on `User`
- bcrypt password hashing
- JWT generation
- JWT cookie
- custom `verifyToken` middleware
- custom auth routes under `/api/auth`

The current `Tree` model is linked to the custom `User` model through a Prisma relation.

The V1 plan requires Better Auth to own authentication, so LineAge should no longer own user/password/session/account logic.

---

## Target State for This Phase

After this phase:

- Better Auth owns authentication.
- Better Auth owns user/session/account-related tables.
- LineAge no longer stores user passwords.
- LineAge `Tree.ownerId` stores the Better Auth user ID as a string.
- Backend private routes use Better Auth session data.
- Frontend login/register/logout use Better Auth.
- Google login is configured.
- Existing tree/person/relationship behavior continues at its current level.
- No unrelated V1 domain changes are mixed into this phase.

---

## In Scope

### Backend

- Install/configure Better Auth.
- Configure email/password auth.
- Configure Google auth.
- Mount Better Auth under `/api/auth`.
- Remove runtime use of custom auth routes/controllers.
- Replace `verifyToken` with Better Auth session-based middleware.
- Keep `req.user.id` compatibility temporarily if useful.
- Update route protection to use the new auth middleware.
- Remove custom `User` model from LineAge-owned schema.
- Keep `Tree.ownerId` as a plain string.
- Reset database/migrations as needed.

### Frontend

- Replace custom auth API calls with Better Auth client calls.
- Keep existing routes for now:
  - `/register`
  - `/login`
  - `/trees`
  - `/trees/:treeId`

- Add email/password signup.
- Add email/password login.
- Add Google login.
- Add logout.
- Add session check for protected pages.
- Keep current dashboard/tree editor behavior as stable as possible.

### Tests

- Update auth helpers to authenticate through Better Auth.
- Keep tests focused on auth migration.
- Do not rewrite all V1 domain tests yet.

---

## Out of Scope

Do not include the following in this phase:

- `/persons` to `/people` rename
- `/graph` to `/full` rename
- final V1 person schema
- final V1 relationship schema
- partial dates
- gender field
- birth place
- biography rename
- share links
- public tree page
- full V1 error response format
- relationship rule overhaul
- React Flow layout changes
- UI redesign
- Tailwind/shadcn migration
- typed delete confirmations
- dashboard search
- public search
- deployment setup

---

## Backend Implementation Notes

### Better Auth Mounting

Better Auth should handle:

```txt
/api/auth/*
```

The backend should not keep custom auth endpoints as the active implementation.

The auth handler should be mounted before middleware that could interfere with Better Auth request handling.

Conceptual route order:

```ts
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.all("/api/auth/{*any}", betterAuthHandler);

app.use(express.json());
app.use(cookieParser());
app.use(loggerMiddleware);

app.use("/api/trees", treeRoutes);
app.use("/api/trees/:treeId/persons", personRoutes);
app.use("/api/trees/:treeId/relationships", relationshipRoutes);
app.use("/api/trees/:treeId/graph", graphRoutes);
```

Exact implementation should follow Better Auth’s current Express integration requirements.

---

## Minimal Prisma Change for This Phase

The current custom `User` model should be removed from LineAge-owned schema.

The `Tree` model should no longer have a Prisma relation to the old custom `User`.

For this phase only, `Tree` can remain minimal:

```prisma
model Tree {
  id        String @id @default(uuid())
  name      String
  ownerId   String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  persons       Person[]
  relationships Relationship[]

  @@index([ownerId])
}
```

This is not the final V1 `Tree` model. The final V1 schema refactor happens later.

---

## Auth Middleware Target

Create a new auth middleware, conceptually named:

```txt
requireAuth
```

Its job:

1. Read the Better Auth session.
2. Reject unauthenticated requests with `401`.
3. Attach the authenticated user ID to the request.

Temporary compatibility shape:

```ts
req.user = {
  id: session.user.id,
};
```

This lets existing ownership code continue to work with minimal changes.

---

## Ownership Behavior

Existing ownership checks should continue to work conceptually:

```ts
where: {
  id: treeId,
  ownerId: req.user.id
}
```

The difference is that `req.user.id` now comes from Better Auth instead of a custom JWT.

---

## Frontend Implementation Notes

Create a Better Auth client file, conceptually:

```txt
frontend/src/auth/authClient.ts
```

The frontend should use this for:

- sign up with email/password
- sign in with email/password
- sign in with Google
- sign out
- session/current-user checks

The existing register and login pages can stay for now, but their internals should call Better Auth instead of custom API services.

---

## Google Login Requirements

Google login requires:

- Google OAuth client ID
- Google OAuth client secret
- allowed redirect URI configured in Google Cloud Console
- Better Auth configured with the Google provider

Local callback path should match the Better Auth backend route.

Example local callback shape:

```txt
http://localhost:3000/api/auth/callback/google
```

Exact value must match the Better Auth base path used in implementation.

---

## Environment Variables

Backend environment variables expected for this phase:

```txt
DATABASE_URL=
TEST_DATABASE_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Frontend environment variables expected for this phase:

```txt
VITE_API_URL=http://localhost:3000
```

Additional variables may be required by Better Auth depending on the exact adapter/client setup.

---

## Files Likely Affected

Backend:

```txt
backend/package.json
backend/prisma/schema.prisma
backend/src/server.ts
backend/src/routes/authRoutes.ts
backend/src/controllers/authController.ts
backend/src/middleware/verifyToken.ts
backend/src/middleware/validateOwner.ts
backend/src/routes/treeRoutes.ts
backend/src/routes/personRoutes.ts
backend/src/routes/relationshipRoutes.ts
backend/src/routes/graphRoutes.ts
backend/src/tests/helpers/auth.ts
```

New backend files may include:

```txt
backend/src/auth/auth.ts
backend/src/auth/requireAuth.ts
```

Frontend:

```txt
frontend/package.json
frontend/src/pages/RegisterPage.tsx
frontend/src/pages/LoginPage.tsx
frontend/src/App.tsx
frontend/src/api/axios.ts
```

New frontend files may include:

```txt
frontend/src/auth/authClient.ts
frontend/src/auth/useRequireSession.ts
```

The exact file list may change during implementation.

---

## Phase Done Criteria

This phase is done when:

- Better Auth handles `/api/auth/*`.
- Email/password signup works.
- Email/password login works.
- Google login is configured and available.
- Logout works.
- Custom bcrypt/JWT auth is no longer used at runtime.
- Custom `User.password` model is gone.
- `Tree.ownerId` stores the Better Auth user ID.
- Private backend routes use Better Auth session.
- Frontend auth pages use Better Auth.
- Dashboard loads only the authenticated user’s trees.
- User A cannot access User B’s trees.
- Tests authenticate through the new auth mechanism.
- Existing non-auth functionality remains at its current level.
- No unrelated V1 refactors were mixed into this phase.
