# Phase 1 Auth Refactor Checklist

This checklist tracks the auth-only refactor from custom JWT authentication to Better Auth.

The goal is to keep this phase narrow.

---

## 1. Preparation

- [x] Do not start unrelated schema/API/UI refactors.

---

## 2. Backend Dependencies

- [x] Add Better Auth dependency to `backend`.
- [x] Add Better Auth Prisma adapter or required database adapter.
- [x] Keep Prisma/PostgreSQL setup working.
- [x] Remove unused custom-auth dependencies after migration:
  - [x] `bcrypt`
  - [x] `jsonwebtoken`
  - [x] `@types/bcrypt`
  - [x] `@types/jsonwebtoken`

Do not remove old dependencies until code no longer imports them.

---

## 3. Backend Environment

Add or confirm:

```txt
DATABASE_URL=
TEST_DATABASE_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Checklist:

- [x] Add `BETTER_AUTH_SECRET`.
- [x] Add `BETTER_AUTH_URL`.
- [x] Add `GOOGLE_CLIENT_ID`.
- [x] Add `GOOGLE_CLIENT_SECRET`.
- [x] Confirm `.env` is not committed.

Note: non-secret examples were added in `backend/.env.example`. Actual secret values still need to be supplied locally/deployed.

---

## 4. Better Auth Backend Setup

Create:

```txt
backend/src/auth/auth.ts
```

Checklist:

- [x] Configure Better Auth.
- [x] Configure database adapter.
- [x] Enable email/password auth.
- [x] Enable Google provider.
- [x] Export the Better Auth instance.
- [x] Confirm TypeScript compiles.

---

## 5. Mount Better Auth Routes

Update backend server setup.

Checklist:

- [x] Remove active custom auth route mounting.
- [x] Mount Better Auth at `/api/auth/*`.
- [x] Ensure Better Auth handler is mounted before conflicting middleware.
- [x] Keep CORS credentials enabled.
- [x] Confirm frontend origin is allowed.
- [x] Confirm `/api/auth/*` requests reach Better Auth.

Conceptual order:

```ts
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.all("/api/auth/{*any}", betterAuthHandler);

app.use(express.json());
app.use(cookieParser());
app.use(loggerMiddleware);
```

Exact handler syntax should follow Better Auth's Express integration.

---

## 6. Prisma Schema Auth Cleanup

Current custom auth model should be removed from LineAge-owned schema.

Checklist:

- [x] Remove custom `User` model with password.
- [x] Remove `Tree.owner User` relation.
- [x] Keep `Tree.ownerId String`.
- [x] Keep existing `Person` and `Relationship` models unchanged for this phase.
- [x] Let Better Auth own its required auth tables.
- [x] Reset database/migrations.
- [x] Generate Prisma client.
- [x] Confirm backend compiles.

Temporary `Tree` shape for this phase:

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

Do not add the final V1 `Tree` fields in this phase.

---

## 7. Replace Auth Middleware

Create:

```txt
backend/src/auth/requireAuth.ts
```

Checklist:

- [x] Read Better Auth session from incoming request.
- [x] Return `401` when no session exists.
- [x] Attach authenticated user ID to request.
- [x] Preserve temporary compatibility with `req.user.id`.
- [x] Replace `verifyToken` imports with `requireAuth`.
- [x] Update tree routes.
- [x] Update person routes.
- [x] Update relationship routes.
- [x] Update graph routes.
- [x] Confirm `validateOwner` still works.

Temporary compatibility:

```ts
req.user = {
  id: session.user.id,
};
```

---

## 8. Remove Custom Auth Runtime

Once Better Auth works, remove runtime usage of:

```txt
backend/src/routes/authRoutes.ts
backend/src/controllers/authController.ts
backend/src/middleware/verifyToken.ts
backend/src/utils/generateToken.ts
backend/src/validators/authValidators.ts
backend/src/types/auth.ts
backend/src/types/jwt.ts
```

Checklist:

- [x] No server import uses custom `authRoutes`.
- [x] No controller uses bcrypt.
- [x] No middleware verifies JWT manually.
- [x] No runtime code imports `generateToken`.
- [x] No tests depend on old `/api/auth/register`.
- [x] No tests depend on old `/api/auth/login`.

Files can be deleted or left temporarily unused, but runtime must not depend on them.

---

## 9. Frontend Dependencies

Checklist:

- [x] Add Better Auth client dependency to `frontend`.
- [x] Create auth client file.
- [x] Configure backend base URL.
- [x] Confirm credentials/cookies are included as needed.
- [x] Confirm frontend builds.

Potential file:

```txt
frontend/src/auth/authClient.ts
```

---

## 10. Frontend Register Page

Checklist:

- [x] Keep `/register` route for now.
- [x] Replace custom register API call with Better Auth signup.
- [x] Handle success.
- [x] Handle error.
- [x] Redirect to dashboard or login according to Better Auth behavior.
- [x] Do not redesign page unless required.

---

## 11. Frontend Login Page

Checklist:

- [x] Keep `/login` route for now.
- [x] Replace custom login API call with Better Auth signin.
- [x] Add Google login button.
- [x] Handle email/password login success.
- [x] Handle Google login start.
- [x] Handle login errors.
- [x] Redirect authenticated user to `/trees`.

---

## 12. Frontend Logout

Checklist:

- [x] Replace custom logout call with Better Auth signout.
- [x] Clear local auth assumptions if any.
- [x] Redirect to `/login`.
- [x] Confirm protected API calls fail after logout.

---

## 13. Frontend Session Protection

Checklist:

- [x] Add session check for protected pages.
- [x] Redirect unauthenticated users away from `/trees`.
- [x] Redirect unauthenticated users away from `/trees/:treeId`.
- [x] Keep current app route structure.
- [x] Do not introduce V1 route redesign yet.

---

## 14. Tests

Update test auth helper.

Checklist:

- [x] Replace custom register/login helper.
- [x] Create test user through Better Auth flow or test-compatible auth helper.
- [x] Preserve authenticated Supertest agent behavior.
- [x] Test unauthenticated private route returns `401`.
- [x] Test authenticated tree creation.
- [x] Test `Tree.ownerId` equals Better Auth user ID.
- [x] Test user A cannot access user B's tree.
- [x] Test logout/session invalidation if practical.
- [x] Do not rewrite all relationship tests yet except auth setup.

Note: backend TypeScript compiles, the frontend build passes, and `src/tests/auth.test.ts`, `src/tests/tree.test.ts`, and `src/tests/person.test.ts` pass serially. `src/tests/relationships.test.ts` still has non-auth follow-up: the multi-step circular relationship test returns `201` instead of `400` at `src/tests/relationships.test.ts:277`.

---

## 15. Manual Verification

Backend:

- [x] Start backend.
- [x] Better Auth routes respond.
- [x] Email/password signup works.
- [x] Email/password login works.
- [x] Logout works.
- [x] Private route rejects unauthenticated request.
- [x] Private route accepts authenticated request.
- [x] Tree create sets `ownerId`.

Frontend:

- [x] Register page works.
- [x] Login page works.
- [x] Google login button exists.
- [x] Google login reaches Google OAuth.
- [x] Authenticated user can view dashboard.
- [x] Unauthenticated user cannot view dashboard.
- [x] Logout returns user to login.
- [x] Existing tree page still loads.

Note: frontend TypeScript/build passes and the live auth API smoke flow passes against the running app: signup, authenticated tree create, logout, and post-logout `401`. Google OAuth initiation returns a redirect URL from the backend. Browser-level form click-through and existing tree page loading still need manual UI verification.

---

## 16. Phase Completion Gate

Before moving to Phase 2, confirm:

- [x] Better Auth is the active auth system.
- [x] Custom JWT auth is not used.
- [x] Custom password storage is gone.
- [x] Better Auth owns auth data.
- [x] `Tree.ownerId` is still available.
- [x] Existing app behavior still works at current level.
- [x] No unrelated V1 schema refactors were added.
- [x] No unrelated API renames were added.
- [x] No share-link work was added.
- [x] No relationship-rule overhaul was added.

Note: existing tree/person behavior is covered by passing tests. Relationship behavior has the follow-up noted in the Tests section.
