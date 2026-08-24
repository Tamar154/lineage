# Phase 4 V1 Error Format Testing Plan

This document defines the test plan for the Phase 4 LineAge error-format refactor.

The goal is to verify a stable, safe error envelope and mapping without turning Phase 4 into the relationship-rule, validation-expansion, frontend-form, or sharing phase.

---

## Scope

This phase tests:

- the exact error response envelope
- centralized code-to-status mapping
- optional details behavior
- Zod field/form error mapping
- malformed JSON handling
- safe unexpected-error handling
- existing tree, person, and relationship error migrations
- ownership concealment
- Prisma uniqueness translation
- minimal frontend error extraction
- preservation of Phase 3 success responses
- Better Auth error-boundary separation

This phase does not test future behavior for:

- relationship pair conflicts
- max two parents
- full multi-generation cycles
- share links
- public routes
- final frontend field-error presentation

---

## Test Layers

Use:

1. unit tests for the catalog, `AppError`, validation mapping, and frontend extraction helper
2. backend integration tests for real LineAge routes and statuses
3. an isolated Express test app or equivalent for unexpected-error handling
4. existing PostgreSQL integration tests for persistence conflicts and ownership
5. frontend TypeScript/Vite build verification
6. targeted manual browser checks for current visible errors

Keep database-backed test files deterministic and serial while they share one cleared test database.

---

## Exact Envelope Assertions

Every handled LineAge error must match:

```json
{
  "error": {
    "code": "SOME_CODE",
    "message": "Safe public message."
  }
}
```

When details exist:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "details": {
      "fields": {
        "name": "Name is required."
      }
    }
  }
}
```

Assert:

- top-level key set is exactly `error`
- `error.code` is a non-empty known string
- `error.message` is a non-empty safe string
- `details` is omitted when absent
- prototype `status` is absent
- top-level `message` is absent
- stack/internal fields are absent

---

## Required Unit Tests

### 1. Error catalog

For every active Phase 4 code, verify the exact HTTP status and default message.

Acceptance:

- no duplicate code definitions
- known conflict codes map to `409`
- `UNAUTHENTICATED` maps to `401`
- `NOT_FOUND` and `PERSON_NOT_IN_TREE` map to `404`
- `VALIDATION_ERROR` maps to `400`
- `INTERNAL_ERROR` maps to `500`

### 2. AppError construction

Verify:

- code selects the catalog status
- default message is used when not overridden
- safe resource-specific message may override the default
- details are retained when supplied
- call sites cannot create a known code with a contradictory status
- `AppError` remains an `Error`

### 3. Zod field mapping

Test issues for:

```txt
name
personId
birthDatePrecision
nested.path
```

Acceptance:

- dot-path keys are stable
- first useful message per field is retained
- no raw Zod issue object is returned

### 4. Zod form-error mapping

Test an empty-path/root issue.

Acceptance:

- message appears under `formErrors`
- empty `fields` is omitted

### 5. Frontend extraction helper

Test:

- valid Axios LineAge error → returns typed API error/message
- non-Axios error → fallback
- malformed response → fallback
- Better Auth `Error` usage remains separate

---

## Required Backend Integration Tests

### 1. Unauthenticated LineAge request

```txt
GET /api/trees
without session
```

Acceptance:

```txt
401
code = UNAUTHENTICATED
approved envelope
```

Do not require Better Auth's own `/api/auth/*` errors to use this shape.

### 2. Unknown LineAge route

Acceptance:

```txt
404
code = NOT_FOUND
safe route-not-found message
```

### 3. Private tree concealment

User B requests User A's tree metadata and `/full`.

Acceptance:

```txt
404
code = NOT_FOUND
response does not confirm owner or tree existence
```

### 4. Zod body validation

Create a tree with an empty/missing name.

Acceptance:

```txt
400
code = VALIDATION_ERROR
details.fields.name is useful
raw Zod formatting is absent
```

### 5. Route-parameter validation

Use an invalid `treeId`, `personId`, or `relationshipId` on routes that validate it.

Acceptance:

```txt
400
code = VALIDATION_ERROR
details.fields contains the parameter path
```

Do not broaden Phase 4 into adding unrelated route-validation architecture unless a touched route requires it.

### 6. Empty PATCH body

Acceptance:

```txt
400
code = VALIDATION_ERROR
details.formErrors contains the non-empty-update message
```

### 7. Person partial-date validation

Test one invalid date/precision pair.

Acceptance:

- `400 VALIDATION_ERROR`
- details identify the relevant date input or provide a clear form-level message
- accepted date behavior remains unchanged

### 8. Tree-name conflict

Test both:

- detected duplicate before insert
- Prisma unique-conflict translation where practical

Acceptance:

```txt
409
code = TREE_NAME_ALREADY_EXISTS
message is safe and user-facing
no Prisma code appears
```

### 9. Missing person

Patch/delete a valid UUID not present in the validated tree.

Acceptance:

```txt
404
code = NOT_FOUND
```

### 10. Relationship participant outside tree

Acceptance:

```txt
404
code = PERSON_NOT_IN_TREE
no cross-owner data is disclosed
```

### 11. Self-relationship

Acceptance:

```txt
400
code = VALIDATION_ERROR
safe form-level details or message
```

### 12. Duplicate relationship

Acceptance:

```txt
409
code = RELATIONSHIP_ALREADY_EXISTS
```

Test spouse reverse duplicates through canonical normalization.

### 13. Existing spouse limit

Acceptance:

```txt
409
code = MAX_SPOUSE_LIMIT_REACHED
```

This test records existing behavior only. It does not prove concurrency safety.

### 14. Existing direct-cycle rejection

Acceptance:

```txt
409
code = RELATIONSHIP_CYCLE_DETECTED
```

Do not add or claim complete multi-generation cycle coverage here.

### 15. Missing relationship delete

Acceptance:

```txt
404
code = NOT_FOUND
```

### 16. Malformed JSON

Send syntactically invalid JSON with `Content-Type: application/json`.

Acceptance:

```txt
400
code = VALIDATION_ERROR
safe message
parser stack/body is absent
```

### 17. Unexpected error

Use an isolated test route/app or a controlled mock that throws a normal `Error` containing a sensitive sentinel string.

Acceptance:

```txt
500
code = INTERNAL_ERROR
generic public message
sentinel is not present
stack is not present
original error is logged server-side
```

Do not add a production-only crash route.

---

## Success Regression Tests

Confirm Phase 4 does not change successful responses:

- tree list/create/get/update still use `{ data: ... }`
- person create/update still use `{ data: ... }`
- relationship create still uses `{ data: ... }`
- `/full` still returns `{ data: { tree, people, relationships } }`
- successful deletes remain empty `204`
- DTO field allowlists remain intact

---

## Security and Leakage Tests

For representative `400`, `401`, `404`, `409`, and `500` responses, recursively assert the absence of:

```txt
stack
sql
query
P2002
ownerId
normalizedName
password
token
tokenHash
accessToken
refreshToken
session
account
verification
filesystem paths
```

Do not rely only on keyword scanning; also assert exact allowed response keys.

---

## Better Auth Boundary Tests

Confirm:

- LineAge's `requireAuth` rejection uses `UNAUTHENTICATED`
- Better Auth signup/signin errors continue to use Better Auth behavior
- Phase 4 middleware ordering does not intercept successful Better Auth responses
- no auth internals are copied into LineAge `details`

Do not rewrite Better Auth tests to expect the LineAge envelope from `/api/auth/*`.

---

## Frontend Verification

Required automated verification:

```txt
frontend TypeScript build passes
Vite production build passes
```

Confirm current LineAge error consumers no longer read:

```txt
response.data.message
```

They should use the shared helper or the typed nested error contract.

Do not require final inline field messages in forms during this phase.

---

## Manual Browser Smoke Verification

Do not mark these complete based only on automated tests.

1. Log in and load the tree dashboard.
2. Try creating a duplicate tree and confirm a useful message appears.
3. Trigger one ordinary validation error and confirm the UI does not crash.
4. Confirm successful tree loading still works.
5. Confirm logout and protected-route behavior still work.

Phase 7 owns richer field-level presentation.

---

## README Verification

Confirm README documents:

- the exact LineAge error envelope
- validation `details` concept
- representative status/code mappings
- Better Auth endpoint responses as a separate contract
- no unimplemented Phase 5 or Phase 9 behavior

---

## Test Completion Criteria

Phase 4 testing is complete when:

- catalog and mapper unit tests pass
- all active LineAge error paths use the approved envelope
- current `400`, `401`, `404`, `409`, and `500` mappings are tested
- malformed JSON and unexpected errors are safe
- ownership concealment remains intact
- success response regressions pass
- Better Auth regressions pass
- frontend builds and current error messages work
- manual verification is recorded accurately
- deferred error codes are not represented as implemented behavior
