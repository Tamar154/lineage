# Phase 3: V1 API Contract Refactor

## Purpose

This document defines Phase 3 of the LineAge refactor.

Phase 1 replaced custom authentication with Better Auth. Phase 2 established the V1 domain schema and persistence vocabulary. Phase 3 now makes the private LineAge HTTP API match the V1 contract and introduces explicit response DTO boundaries.

The V1 PRD and API specification remain the product sources of truth. This phase document resolves the response-shape details that those documents intentionally left open.

No unrelated V1 feature should be included in this phase.

---

## Phase Goal

Replace the prototype API surface with the private V1 API surface while preserving the currently implemented tree editor behavior.

After this phase:

- private person routes use `/people`, not `/persons`
- person updates use `PATCH`, not `PUT`
- the editor loads aggregate tree data from `/full`, not `/graph`
- V1-excluded person and relationship read/update endpoints are removed
- relationship creation accepts the user-facing `relation` contract
- every successful LineAge response is produced through an explicit DTO boundary
- internal persistence and ownership fields are not returned accidentally
- the frontend uses the new endpoints without a visual or form redesign

---

## Confirmed Contract Decisions

### Successful response envelope

Successful LineAge JSON responses use:

```ts
type ApiSuccess<T> = {
  data: T;
};
```

Do not retain the prototype-only `status: "success"` field.

Successful deletes return `204 No Content` with no JSON body.

This decision applies only to successful LineAge responses. Phase 4 owns the final error envelope and error codes.

### Tree DTO

```ts
type TreeDto = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};
```

Dates are serialized as ISO 8601 strings in JSON.

The API must not expose:

```txt
ownerId
normalizedName
Prisma relation objects
Better Auth data
```

### Person DTO

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

The API must not expose `treeId`, Prisma relation objects, or persistence timestamps for people.

### Relationship DTO

```ts
type RelationshipDto = {
  id: string;
  personAId: string;
  personBId: string;
  type: "PARENT_CHILD" | "SPOUSE";
};
```

The response uses the stored canonical representation:

- `PARENT_CHILD`: A is parent and B is child
- `SPOUSE`: A/B is the normalized stable pair

The API must not expose `treeId`, timestamps, or Prisma relation objects.

### Full-tree DTO

```ts
type FullTreeDto = {
  tree: TreeDto;
  people: PersonDto[];
  relationships: RelationshipDto[];
};
```

The Phase 3 response is:

```json
{
  "data": {
    "tree": {
      "id": "tree-id",
      "name": "Cohen Family",
      "description": null,
      "createdAt": "2026-07-19T00:00:00.000Z",
      "updatedAt": "2026-07-19T00:00:00.000Z"
    },
    "people": [],
    "relationships": []
  }
}
```

Do not add `shareLink` yet. Phase 9 owns share-link persistence and API behavior.

### Relationship creation request

The public request contract uses user-facing relation values:

```ts
type CreateRelationshipRequest = {
  personAId: string;
  personBId: string;
  relation: "PARENT" | "CHILD" | "SPOUSE";
};
```

Conversion rules:

```txt
PARENT: input A is parent of input B
→ stored PARENT_CHILD with A unchanged and B unchanged

CHILD: input A is child of input B
→ stored PARENT_CHILD with A/B swapped

SPOUSE: input A and B are spouses
→ stored SPOUSE after stable pair normalization
```

The client must not send the persistence field `type`. Request validation remains strict.

This conversion is an API-to-domain translation, not the Phase 5 relationship-rule overhaul.

---

## Final Private Endpoint Surface for Phase 3

### Trees

```txt
GET    /api/trees
POST   /api/trees
GET    /api/trees/:treeId
PATCH  /api/trees/:treeId
DELETE /api/trees/:treeId
GET    /api/trees/:treeId/full
```

### People

```txt
POST   /api/trees/:treeId/people
PATCH  /api/trees/:treeId/people/:personId
DELETE /api/trees/:treeId/people/:personId
```

### Relationships

```txt
POST   /api/trees/:treeId/relationships
DELETE /api/trees/:treeId/relationships/:relationshipId
```

Better Auth continues to own:

```txt
/api/auth/*
```

---

## Endpoints Removed in This Phase

Remove these routes completely; do not keep compatibility aliases:

```txt
POST   /api/trees/:treeId/persons
GET    /api/trees/:treeId/persons
GET    /api/trees/:treeId/persons/:id
PUT    /api/trees/:treeId/persons/:id
DELETE /api/trees/:treeId/persons/:id

GET    /api/trees/:treeId/people
GET    /api/trees/:treeId/people/:personId

GET    /api/trees/:treeId/relationships
GET    /api/trees/:treeId/relationships/:relationshipId
PUT    /api/trees/:treeId/relationships/:relationshipId
PATCH  /api/trees/:treeId/relationships/:relationshipId

GET    /api/trees/:treeId/graph
```

LineAge is pre-production, so a clean contract replacement is preferable to temporary legacy aliases.

---

## In Scope

### Backend routing

- Mount people routes at `/api/trees/:treeId/people`.
- Rename person route parameter `id` to `personId`.
- Change person update from `PUT` to `PATCH`.
- Remove person list and person-by-ID routes.
- Remove relationship list, by-ID, and update routes.
- Rename relationship route parameter `id` to `relationshipId`.
- Replace `/graph` with `/full`.
- Keep the existing tree metadata endpoints, including `PATCH /api/trees/:treeId`.
- Do not keep deprecated aliases.

### Backend contracts

- Add explicit request and response types for the Phase 3 surface.
- Add centralized DTO selection/mapping for trees, people, relationships, and full-tree data.
- Return only allowlisted fields.
- Add user-facing relationship input conversion.
- Keep request validation strict.
- Preserve current HTTP success statuses.

### Frontend compatibility

- Update API service paths from `/persons` to `/people`.
- Use `PATCH` for person updates.
- Replace graph service usage with the `/full` endpoint.
- Read the new `{ data: ... }` success shapes.
- Send `relation`, not persistence `type`, when creating relationships.
- Remove unused frontend calls for V1-excluded GET endpoints.
- Keep the current editor and visual layout behavior working.

### Tests and documentation

- Replace legacy endpoint assertions with V1 contract assertions.
- Add exact DTO field tests.
- Add regression tests for ownership and nested-resource scoping.
- Add tests proving retired routes are unavailable.
- Update README API documentation in the same PR.

---

## Out of Scope

Do not include:

- final error envelope or error codes
- feature-specific `403` versus `404` decisions
- max-one-spouse concurrency redesign
- max-two-parents rule
- spouse/parent-child pair conflict rule
- complete ancestor-cycle detection
- new relationship persistence constraints
- new person/tree validation rules beyond existing behavior
- `ShareLink`
- public tree routes
- React Flow redesign or layout changes
- typed delete confirmations
- frontend search
- new forms or visual redesign
- Tailwind/shadcn migration
- deployment, CI/CD, import, export, or collaboration

Existing compatible relationship checks may remain. Do not broaden or rewrite the relationship rule engine in this phase.

---

## DTO Boundary Design

Create a clear backend boundary, for example:

```txt
backend/src/dtos/
  treeDto.ts
  personDto.ts
  relationshipDto.ts
  fullTreeDto.ts
```

Exact file grouping may vary, but the responsibilities must remain clear:

- controllers handle HTTP parameters, request bodies, statuses, and responses
- services own domain behavior
- validators validate public input contracts
- Prisma owns persistence
- DTO selectors/mappers own external response fields

Do not return a Prisma model directly from a controller.

Prefer explicit Prisma `select` objects and typed mapper functions. A mapper remains useful when a controller receives `req.tree`, because ownership middleware currently attaches a complete persistence record.

Keep one canonical DTO definition per resource. The `/full` endpoint must reuse the same tree, person, and relationship DTO contracts used by mutation responses.

---

## Ownership and Security

All private routes must preserve this order:

1. authenticate with Better Auth
2. load the route tree using both `treeId` and authenticated `ownerId`
3. perform the nested operation within that validated tree

Requirements:

- never accept `ownerId` or `normalizedName` from client input
- never return `ownerId` or `normalizedName`
- never expose Better Auth `Account`, `Session`, `Verification`, secrets, or OAuth data
- scope person reads/writes by both `personId` and the validated tree
- scope relationship deletion by both `relationshipId` and the validated tree
- validate both relationship participants against the validated tree
- do not use a valid UUID as proof of authorization
- do not spread request bodies directly into Prisma operations unless the strict validator has produced an allowlisted object

Retiring GET endpoints must not weaken ownership checks on the endpoints that remain.

---

## Implementation Order

1. Define the exact DTO and success-envelope types.
2. Add reusable Prisma selections and DTO mappers.
3. Refactor tree controllers to return explicit Tree DTOs.
4. Replace graph routing/controller/types with the full-tree contract.
5. Rename person routes and parameters; remove excluded GET routes; switch update to `PATCH`.
6. Refactor relationship routes and add `relation` conversion.
7. Remove excluded relationship controllers/types and unused imports.
8. Update frontend services and the current tree editor for contract compatibility.
9. Rewrite/add integration tests for the new surface and field boundaries.
10. Update README to describe the currently implemented API.
11. Run the Phase 3 validation plan and update the checklist only with verified results.

---

## README Impact Assessment

README update is required because this phase changes documented API routes, methods, request bodies, response shapes, and frontend/backend integration.

At minimum update:

- `persons` to `people`
- person `PUT` to `PATCH`
- remove excluded person GET routes
- remove relationship GET/update routes
- relationship request example to use `relation`
- `graph` to `full`
- successful response-envelope examples

Do not document Phase 4 errors, Phase 5 relationship rules, or Phase 9 sharing as implemented.

---

## Phase Completion Criteria

Phase 3 is complete when:

- only the documented Phase 3 private endpoints are mounted
- retired routes return the normal not-found response
- successful JSON responses use `{ data: ... }`
- all response bodies match their exact DTOs
- `ownerId` and `normalizedName` are absent from every tree response
- persistence-only person and relationship fields are absent
- `/full` returns `tree`, `people`, and `relationships`
- relationship request conversion works for `PARENT`, `CHILD`, and `SPOUSE`
- Better Auth and owner isolation remain intact
- the current frontend builds and the editor works through the new API
- backend contract and ownership tests pass
- README matches the implemented API
- final error-format and advanced relationship-rule work remain deferred

