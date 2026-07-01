# Phase 1 Auth Testing Plan

This document defines the test plan for the Better Auth migration phase.

The purpose is to verify the auth replacement only. This is not the full V1 testing plan.

---

## Scope

This phase tests:

- Better Auth email/password auth
- Better Auth Google auth availability/configuration
- session-based route protection
- ownership behavior using Better Auth user IDs
- frontend auth flow at a basic level
- preservation of current app behavior after auth swap

This phase does not test:

- final V1 relationship rules
- final V1 person fields
- partial dates
- share links
- public read-only tree pages
- final V1 error response format
- final visual tree behavior

---

## Test Layers Used in This Phase

LineAge V1 will eventually use:

- unit tests
- integration tests
- end-to-end tests

For this phase, the focus should be:

1. backend integration tests
2. minimal frontend/manual verification
3. optional focused unit tests for auth helpers

Full E2E coverage can be added later after the auth flow stabilizes.

---

## Backend Integration Test Goals

The backend should prove:

- unauthenticated private requests fail
- authenticated private requests succeed
- user identity comes from Better Auth
- tree ownership uses Better Auth user ID
- one user cannot access another user’s private tree
- logout/session invalidation works if practical in the test setup

---

## Test Helper Refactor

Current tests likely use a helper that does:

```txt
POST /api/auth/register
POST /api/auth/login
```

That helper must be replaced.

New helper should support:

```ts
const user = createAuthTestUser();

await user.signUp();
await user.signIn();

user.agent; // authenticated Supertest agent
user.id; // Better Auth user ID if available
```

Exact implementation depends on Better Auth’s test-compatible API.

The helper should hide auth mechanics from business tests.

---

## Required Backend Tests

### 1. Unauthenticated private route fails

Example:

```txt
GET /api/trees
without session
→ 401
```

Acceptance:

- response status is `401`
- route does not return private data

---

### 2. Email/password signup works

Example:

```txt
sign up with email/password
→ user/session created
```

Acceptance:

- signup succeeds
- session cookie or session state is established according to Better Auth behavior
- created user can be used for authenticated requests

---

### 3. Email/password login works

Example:

```txt
sign in with email/password
→ session created
```

Acceptance:

- login succeeds
- authenticated request succeeds afterward

---

### 4. Authenticated user can create tree

Example:

```txt
sign in
POST /api/trees { name: "Test Tree" }
→ 201
```

Acceptance:

- tree is created
- response includes tree data
- database row has `ownerId` equal to Better Auth user ID

---

### 5. User can list only own trees

Example:

```txt
User A creates Tree A
User B creates Tree B
User A requests GET /api/trees
→ only Tree A
```

Acceptance:

- no data leakage between users
- query filters by `ownerId`

---

### 6. User cannot access another user’s tree

Example:

```txt
User A creates tree
User B requests GET /api/trees/:treeId
→ 404 or current project equivalent
```

Acceptance:

- User B does not receive User A’s tree
- ownership middleware uses Better Auth user ID

The exact `403` vs `404` behavior is not finalized for all V1 features. For this phase, preserve the current ownership behavior unless implementation requires otherwise.

---

### 7. Logout prevents further private access

Example:

```txt
sign in
logout
GET /api/trees
→ 401
```

Acceptance:

- session is cleared or invalidated
- private route fails after logout

---

## Google Auth Testing

Google OAuth should be configured in this phase, but automated backend tests should not depend on real Google OAuth.

Required checks:

- Google provider is configured.
- Frontend shows Google login action.
- Clicking Google login starts the provider flow in local/manual testing.
- Google OAuth redirect URI is configured correctly in Google Cloud Console.

Manual local redirect example:

```txt
http://localhost:3000/api/auth/callback/google
```

Exact value must match the configured Better Auth base path.

Automated Google OAuth E2E can be deferred.

---

## Frontend Manual Verification

### Register page

Steps:

1. Open `/register`.
2. Enter email/password.
3. Submit.
4. Confirm user is authenticated or redirected correctly.
5. Confirm dashboard can load.

Expected:

- no custom `/api/auth/register` dependency remains
- Better Auth signup is used

---

### Login page

Steps:

1. Open `/login`.
2. Enter existing email/password.
3. Submit.
4. Confirm user reaches `/trees`.

Expected:

- no custom `/api/auth/login` dependency remains
- session is established

---

### Google login

Steps:

1. Open `/login`.
2. Click “Continue with Google.”
3. Confirm redirect to Google OAuth.
4. Complete login in local environment if credentials are configured.
5. Confirm user returns authenticated.

Expected:

- Google auth flow starts
- callback reaches backend Better Auth route
- authenticated user can access `/trees`

---

### Logout

Steps:

1. Log in.
2. Open dashboard.
3. Log out.
4. Try to access `/trees`.

Expected:

- user is redirected to login or blocked
- private API request is not authenticated

---

## Regression Checks

The following current behavior should still work after the auth refactor:

- authenticated user can create a tree
- authenticated user can list their trees
- authenticated user can open a tree
- authenticated user can add a person
- authenticated user can add a relationship
- authenticated user can view current graph page
- another user cannot access the first user’s tree

These are regression checks only. They do not mean the current API is final V1 API.

---

## Tests Not Required Yet

Do not add or rewrite tests for these in Phase 1:

- `/persons` to `/people`
- `/graph` to `/full`
- partial birth/death dates
- gender
- birth place
- biography
- share links
- public tree page
- max 1 spouse
- max 2 parents
- ancestor-cycle validation
- pair conflict between spouse and parent-child
- final API error response shape

Those belong to later phases.

---

## Phase 1 Test Completion Criteria

Phase 1 testing is complete when:

- auth helper uses Better Auth
- unauthenticated private requests fail
- authenticated private requests succeed
- email/password auth works
- Google login is configured and manually verified
- tree ownership uses Better Auth user ID
- user data remains isolated by owner
- existing current app behavior still works at its current level
- no unrelated V1 business-rule tests were mixed into this phase
