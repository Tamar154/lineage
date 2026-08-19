# Phase 3 V1 API Contract Refactor Rules

Read first:

- `docs/PRD.md`
- `docs/API.md`
- `docs/phase-3-api/phase-3-api-refactor.md`
- `docs/phase-3-api/phase-3-api-testing.md`
- `docs/phase-3-api/phase-3-api-checklist.md`

The V1 documents are the source of truth. The current implementation is evidence of the prototype contract, not a reason to preserve it.

Implement **Phase 3: V1 API Contract Refactor** only.

## Goal

Replace the prototype private API surface with the Phase 3 V1 contract, introduce explicit response DTO boundaries, and keep the current frontend working with only contract-compatibility changes.

## Required successful response contract

All successful LineAge JSON responses use:

```ts
type ApiSuccess<T> = {
  data: T;
};
```

Remove `status: "success"`.

Successful deletes return `204 No Content` with no body.

Do not implement the final error envelope in this phase.

## Required DTOs

Tree:

```ts
type TreeDto = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};
```

Person:

```ts
type PersonDto = {
  id: string;
  firstName: string;
  lastName: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
  birthDate: string | null;
  birthDatePrecision: "YEAR" | "MONTH" | "DAY" | null;
  deathDate: string | null;
  deathDatePrecision: "YEAR" | "MONTH" | "DAY" | null;
  birthPlace: string | null;
  biography: string | null;
};
```

Relationship:

```ts
type RelationshipDto = {
  id: string;
  personAId: string;
  personBId: string;
  type: "PARENT_CHILD" | "SPOUSE";
};
```

Full tree:

```ts
type FullTreeDto = {
  tree: TreeDto;
  people: PersonDto[];
  relationships: RelationshipDto[];
};
```

Do not expose:

- `ownerId`
- `normalizedName`
- nested `treeId`
- person/relationship persistence timestamps
- Prisma relation objects
- Better Auth Account, Session, Verification, tokens, secrets, or OAuth fields

Do not return raw Prisma records from controllers. Use explicit `select` objects and typed DTO mappers. Reuse the same resource DTOs in mutation and `/full` responses.

## Required endpoint surface

Keep or implement only:

```txt
GET    /api/trees
POST   /api/trees
GET    /api/trees/:treeId
PATCH  /api/trees/:treeId
DELETE /api/trees/:treeId
GET    /api/trees/:treeId/full

POST   /api/trees/:treeId/people
PATCH  /api/trees/:treeId/people/:personId
DELETE /api/trees/:treeId/people/:personId

POST   /api/trees/:treeId/relationships
DELETE /api/trees/:treeId/relationships/:relationshipId
```

Better Auth continues to own `/api/auth/*`.

Remove completely:

- `/persons`
- `/graph`
- person GET/list endpoints
- person `PUT`
- relationship GET/list endpoints
- relationship update endpoints

Do not keep compatibility aliases. The project is pre-production.

## Relationship request boundary

Accept exactly:

```ts
type CreateRelationshipRequest = {
  personAId: string;
  personBId: string;
  relation: "PARENT" | "CHILD" | "SPOUSE";
};
```

Convert:

- `PARENT`: A=parent, B=child, stored as `PARENT_CHILD`
- `CHILD`: B=parent, A=child, stored as `PARENT_CHILD`
- `SPOUSE`: stored as `SPOUSE` after stable pair normalization

Reject client field `type` and all unknown fields.

Never sort parent-child IDs. Never infer direction from gender, display order, or React Flow layout.

This phase changes the API-to-domain translation only. Do not implement the advanced relationship-rule engine.

## Controller, service, validator, and persistence boundaries

- Controllers handle HTTP parameters, bodies, status codes, and DTO responses.
- Services own domain behavior, including relationship creation behavior.
- Validators validate the exact public request shape and domain-compatible values.
- Prisma owns persistence.
- DTO modules own the exact external response shape.
- The frontend must not become the source of truth for relationship direction or validation.

Do not spread unvalidated request bodies into persistence operations.

## Ownership and security

- Derive identity only from Better Auth session data.
- Never accept `ownerId` from client input.
- Validate a tree using both route `treeId` and authenticated `ownerId` before nested work.
- Scope person mutations by `personId` and the validated route tree.
- Scope relationship deletion by `relationshipId` and the validated route tree.
- Validate both relationship participants belong to the validated route tree.
- A valid UUID is not proof of access.
- Preserve cross-user and cross-tree regression tests.
- Never expose Better Auth internals.

## Frontend compatibility scope

Required:

- replace `/persons` with `/people`
- replace person `PUT` with `PATCH`
- replace `/graph` loading with `/full`
- consume `{ data: ... }` response shapes
- use the aggregate `people` key
- send `relation`, not stored `type`
- remove unused client methods for endpoints removed from V1
- preserve the current editor, React Flow behavior, and styling

Do not implement Phase 7 forms, confirmations, search, or UX redesign.

## Explicitly out of scope

Do not include:

- final `{ error: { code, message, details } }` error responses
- final error-code catalog
- global `403` versus `404` policy
- spouse/parent-child pair conflict
- max two parents
- full ancestor-cycle detection
- concurrency-safe relationship invariant redesign
- new database constraints or schema changes unless strictly required for compilation
- share links or public routes
- React Flow/layout redesign
- new forms, typed delete confirmations, or search
- Tailwind/shadcn migration
- deployment or CI/CD

Existing compatible relationship checks may remain. Do not claim they are the final Phase 5 implementation.

## Testing requirements

Add or update tests for:

- exact endpoint matrix
- retired endpoint unavailability
- exact DTO keys and forbidden-field absence
- empty and populated `/full`
- person `PATCH`
- PARENT, CHILD, and SPOUSE conversion
- request allowlists
- owner and nested-resource isolation
- Better Auth regression
- frontend build compatibility

Do not make Phase 3 tests depend on the future error body.

Keep database integration tests deterministic. If all files share and clear one test database, run them serially or use another isolation strategy before claiming reliable results.

## Checklist and verification

Update `docs/phase-3-api/phase-3-api-checklist.md` as work is completed.

Only check verified work. Record:

- exact commands run
- independently verified build/test results
- manual browser evidence separately
- pre-existing lint failures separately from Phase 3 regressions

Do not claim all tests pass unless they were run successfully in the current implementation state.

## README impact

README update is required in the same PR because routes, methods, request bodies, response shapes, and frontend/backend integration change.

Update the implemented API sections only. Do not describe Phase 4 errors, Phase 5 relationship rules, or Phase 9 sharing as implemented.

If a product decision is still missing after reading the PRD, API specification, and Phase 3 documents, stop and ask rather than inferring it from prototype code.
