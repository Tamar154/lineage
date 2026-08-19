# Phase 3 V1 API Contract Testing Plan

This document defines the test plan for the Phase 3 API contract refactor.

The purpose is to verify endpoint availability, HTTP methods, request translation, explicit response DTOs, ownership isolation, and current frontend compatibility. It must not become the Phase 4 error-format or Phase 5 relationship-rule test plan.

---

## Scope

This phase tests:

- the final Phase 3 private endpoint matrix
- removal of prototype routes
- `/people` route names and `:personId` parameters
- `PATCH` person update semantics
- `/full` aggregate response
- removal of relationship read/update endpoints
- user-facing relationship `relation` conversion
- exact success-response envelopes and DTO fields
- absence of internal and authentication fields
- authenticated ownership boundaries
- frontend compatibility with the renamed contracts
- README accuracy for the implemented surface

This phase does not test the final behavior of:

- error envelopes or feature-specific error codes
- `403` versus `404` policy
- relationship pair conflicts
- max two parents
- complete ancestor-cycle detection
- atomic max-one-spouse enforcement
- share links or public trees
- final frontend forms, confirmations, search, or visual layout

---

## Test Layers

Use:

1. focused unit tests for pure DTO mappers and relationship request conversion
2. PostgreSQL integration tests for route contracts, persistence, and ownership
3. frontend TypeScript/Vite build verification
4. targeted manual browser smoke testing
5. existing Better Auth regression tests

Playwright E2E may remain deferred unless already configured and inexpensive to run.

---

## Test Data Principles

- Use unique generated users and tree names.
- Authenticate through the existing Better Auth test helper.
- Create records through current public APIs when testing HTTP contracts.
- Use direct Prisma setup only when isolating a DTO leak or persistence assertion is clearer.
- Clean database tables in foreign-key-safe order.
- Keep test files deterministic; do not let parallel files clear a shared database during another test.
- Assert exact response keys where a field boundary is under test.
- Do not preserve a legacy test merely because it describes the prototype API.

---

## Endpoint Matrix Tests

Verify these routes exist for an authenticated owner:

| Method | Endpoint | Expected success |
| --- | --- | --- |
| `GET` | `/api/trees` | `200` |
| `POST` | `/api/trees` | `201` |
| `GET` | `/api/trees/:treeId` | `200` |
| `PATCH` | `/api/trees/:treeId` | `200` |
| `DELETE` | `/api/trees/:treeId` | `204` |
| `GET` | `/api/trees/:treeId/full` | `200` |
| `POST` | `/api/trees/:treeId/people` | `201` |
| `PATCH` | `/api/trees/:treeId/people/:personId` | `200` |
| `DELETE` | `/api/trees/:treeId/people/:personId` | `204` |
| `POST` | `/api/trees/:treeId/relationships` | `201` |
| `DELETE` | `/api/trees/:treeId/relationships/:relationshipId` | `204` |

Verify successful deletes have an empty response body.

---

## Retired Route Tests

Verify the normal not-found behavior for:

```txt
/api/trees/:treeId/persons
/api/trees/:treeId/persons/:id
/api/trees/:treeId/graph
```

Verify V1-excluded operations are unavailable:

```txt
GET   /api/trees/:treeId/people
GET   /api/trees/:treeId/people/:personId
PUT   /api/trees/:treeId/people/:personId
GET   /api/trees/:treeId/relationships
GET   /api/trees/:treeId/relationships/:relationshipId
PUT   /api/trees/:treeId/relationships/:relationshipId
PATCH /api/trees/:treeId/relationships/:relationshipId
```

Acceptance:

- no retired route still reaches a controller
- no legacy alias is mounted
- assertions do not require the Phase 4 error body

---

## Required Unit Tests

### 1. Tree DTO mapping

Given a persistence object containing:

```txt
id, ownerId, name, normalizedName, description, createdAt, updatedAt
```

the DTO contains exactly:

```txt
id, name, description, createdAt, updatedAt
```

Verify timestamps serialize predictably through JSON.

### 2. Person DTO mapping

Verify the mapper returns exactly the Phase 3 Person DTO fields and never returns:

```txt
treeId
createdAt
updatedAt
tree
relationshipsA
relationshipsB
```

### 3. Relationship DTO mapping

Verify the mapper returns exactly:

```txt
id
personAId
personBId
type
```

It must not return `treeId`, timestamps, or relation objects.

### 4. Relationship request conversion

Test:

```txt
PARENT(A, B) → PARENT_CHILD(A parent, B child)
CHILD(A, B)  → PARENT_CHILD(B parent, A child)
SPOUSE(A, B) → SPOUSE passed to canonical spouse normalization
```

Verify conversion does not sort parent-child IDs.

---

## Required Integration Tests

### 1. Tree list DTO

Create owned trees and request:

```txt
GET /api/trees
```

Acceptance:

- response is `{ data: TreeDto[] }`
- every item has exactly the Tree DTO keys
- `ownerId` and `normalizedName` are absent
- only the authenticated user's trees appear
- `status` is absent

### 2. Tree create/get/update DTOs

Verify `POST`, `GET`, and `PATCH` tree responses all reuse the same Tree DTO.

Acceptance:

- allowed fields are consistent across all three endpoints
- internal fields never appear
- update behavior and existing normalization continue to work

### 3. Full-tree DTO

Create an empty tree and request `/full`.

Acceptance:

```json
{
  "data": {
    "tree": {},
    "people": [],
    "relationships": []
  }
}
```

The real tree object must exactly match `TreeDto`.

Then add people and relationships and verify:

- all people match `PersonDto`
- all relationships match `RelationshipDto`
- top-level aggregate key is `people`, not `persons`
- no `shareLink` is present in Phase 3
- no `ownerId`, `normalizedName`, `treeId`, auth model, or Prisma relation object appears anywhere

### 4. Person create DTO

Create a person using:

```txt
POST /api/trees/:treeId/people
```

Acceptance:

- response is `{ data: PersonDto }`
- `201` is returned
- all optional fields are represented according to the existing schema rules
- persistence-only fields are absent

### 5. Person PATCH behavior

Update one field using:

```txt
PATCH /api/trees/:treeId/people/:personId
```

Acceptance:

- supplied field changes
- omitted fields remain unchanged
- response is `{ data: PersonDto }`
- `PUT` on the same V1 path is unavailable

Do not add new validation rules in this test suite; preserve the Phase 2 semantics.

### 6. Person deletion

Delete through the `/people/:personId` route.

Acceptance:

- returns `204` with no body
- person no longer appears in `/full`
- existing cascade behavior remains intact

### 7. Relationship PARENT conversion

Send:

```json
{
  "personAId": "A",
  "personBId": "B",
  "relation": "PARENT"
}
```

Acceptance:

- response is `{ data: RelationshipDto }`
- stored/returned type is `PARENT_CHILD`
- returned A is parent and B is child

### 8. Relationship CHILD conversion

Send the same A/B IDs with `relation: "CHILD"`.

Acceptance:

- stored/returned type is `PARENT_CHILD`
- returned B is parent and A is child
- the conversion is visible in `/full`

### 9. Relationship SPOUSE conversion

Send `relation: "SPOUSE"` in both input orders using isolated test data.

Acceptance:

- stored/returned type is `SPOUSE`
- returned IDs use the canonical stable pair
- current duplicate behavior remains enforced

### 10. Relationship request allowlist

Verify request validation rejects:

```txt
type
treeId
ownerId
unknown fields
unknown relation values
```

Do not assert the final Phase 4 error envelope.

### 11. Relationship deletion

Delete through `:relationshipId`.

Acceptance:

- returns `204` with no body
- relationship disappears from `/full`
- both people remain

---

## Ownership and Security Regression Tests

Retain or add explicit tests for:

- unauthenticated access to every private route group returns `401`
- User A lists only User A trees
- User B cannot read User A tree metadata
- User B cannot load User A `/full`
- User B cannot create, update, or delete a person in User A tree
- User B cannot create or delete a relationship in User A tree
- a person ID from another tree cannot be used under the route tree
- a relationship ID from another tree cannot be deleted under the route tree
- a valid ID never bypasses route-tree ownership

These are API security boundaries and must not be deferred to a later phase.

---

## Response Leak Tests

For each successful JSON endpoint, assert that forbidden fields are absent.

Tree-forbidden fields:

```txt
ownerId
normalizedName
```

Nested resource-forbidden fields:

```txt
treeId
createdAt (people/relationships)
updatedAt (people/relationships)
```

Auth-forbidden fields anywhere:

```txt
password
token
tokenHash
accessToken
refreshToken
session
account
verification
```

Prefer exact-key assertions in addition to a recursive forbidden-key check. Exact DTO tests are the primary boundary; keyword checks are defense in depth.

---

## Error Regression Boundaries

Phase 3 must still verify meaningful HTTP statuses, including:

```txt
400 invalid request under current behavior
401 unauthenticated
404 missing or inaccessible resource under current behavior
204 successful delete
```

Do not require:

- `{ error: { code, message, details } }`
- final error codes
- final conflict status mapping
- final `403` versus `404` policy

Those assertions belong to Phase 4.

---

## Frontend Build Verification

Required:

```txt
frontend TypeScript build passes
Vite production build passes
```

Verify frontend services:

- use `/people`
- use `PATCH` for person updates
- load the editor through `/full`
- use `people`, not `persons`, in the aggregate DTO
- send `relation` values
- consume `{ data: ... }` without an extra or missing nesting level
- contain no remaining runtime references to `/persons` or `/graph`

Do not require Phase 7 form or UX improvements.

---

## Manual Browser Smoke Verification

Do not mark these complete based only on builds or API tests.

1. Register or log in.
2. Load the tree dashboard.
3. Create and open an empty tree.
4. Add a person.
5. Edit one person field.
6. Create parent, child, and spouse relationships with the existing UI paths that are available.
7. Confirm the visual tree reloads from `/full`.
8. Delete a relationship and confirm people remain.
9. Delete a person and confirm the editor refreshes.
10. Confirm logout still prevents private access.

Visual redesign, typed confirmations, and final validation messages are not part of this smoke test.

---

## README Verification

Confirm README describes the implemented Phase 3 API:

- no `/persons`
- no `/graph`
- no relationship GET/update endpoints
- person update uses `PATCH`
- relationship request uses `relation`
- `/full` and success response shape are accurate
- future error/relationship/share features are not described as implemented

---

## Test Completion Criteria

Phase 3 testing is complete when:

- endpoint matrix tests pass
- retired route tests pass
- exact DTO and leak tests pass
- relationship input conversion tests pass
- ownership regression tests pass
- existing Better Auth tests pass
- backend compiles
- frontend builds
- manual browser smoke results are recorded accurately
- README contract documentation matches the running application
- no Phase 4 or Phase 5 assertion is falsely claimed as completed

