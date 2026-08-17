# Phase 2: V1 Domain Schema Refactor

## Purpose

This document defines Phase 2 of the LineAge refactor.

Phase 1 replaced custom JWT/password authentication with Better Auth. Phase 2 refactors the LineAge-owned domain schema toward the agreed V1 model.

The current implementation remains useful as evidence of existing behavior, but it is not the product source of truth. The V1 PRD, API specification, and this phase plan define the target.

No unrelated V1 features should be included in this phase.

---

## Phase Goal

Refactor the persisted domain model for:

- trees
- people
- relationships

while preserving:

- Better Auth
- current route structure
- ownership isolation
- current basic create/read/update/delete flows
- current visual tree at its existing quality level

This phase establishes the data vocabulary and basic persistence invariants that later API, validation, relationship-rule, sharing, and UI phases will build on.

---

## Confirmed Decisions

### Date field names

Use:

```txt
birthDate
birthDatePrecision
deathDate
deathDatePrecision
```

`birthDate` and `deathDate` are partial-date strings, not JavaScript or PostgreSQL full-date values.

### Relationship field names

Keep:

```txt
personAId
personBId
personA
personB
```

Do not rename them to `person1Id` and `person2Id`.

The meaning depends on relationship type:

```txt
PARENT_CHILD
personAId = parent
personBId = child

SPOUSE
A/B has no domain meaning
backend normalizes the pair before persistence
```

This is an intentional compromise. The field names remain stable, but the relationship service is responsible for enforcing type-specific semantics.

### Relationship service boundary

No application code should create relationships directly through Prisma except the relationship domain service.

The relationship service is the source of truth for:

- validating both people belong to the route tree
- rejecting self-relationships
- preserving parent-child direction
- normalizing spouse pairs
- detecting duplicates
- later V1 relationship rules

---

## Expert Review Summary

### Backend perspective

A Prisma schema change affects generated types, validators, controllers, services, fixtures, tests, and some frontend assumptions.

Therefore Phase 2 is not literally schema-only. It includes the minimum compatibility work needed to keep the application compiling and running.

### Architecture perspective

The main risk is combining multiple future phases into one PR.

Phase 2 defines:

- stored fields
- field meaning
- basic persistence invariants
- migration/reset behavior

Phase 2 does not finalize:

- all endpoint names
- final API error format
- complete relationship rule engine
- sharing
- final visual layout
- UI redesign

### Security perspective

The central security invariant remains:

```txt
All Tree, Person, and Relationship access is scoped through an authenticated, owner-validated Tree.
```

Schema changes must not weaken ownership validation.

---

## Current Prototype State

The prototype approximately stores:

```txt
Tree:
- id
- name
- ownerId

Person:
- firstName
- required lastName
- birthDate as DateTime
- deathDate as DateTime
- bio

Relationship:
- personAId
- personBId
- PARENT or SPOUSE
```

Known V1 gaps include:

- no tree description
- no normalized per-owner tree name
- required last name
- no gender
- full dates rather than partial dates
- no birth place
- `bio` instead of `biography`
- `PARENT` rather than `PARENT_CHILD`
- no relationship timestamps

---

## Target State

After Phase 2:

- Better Auth remains unchanged.
- `Tree.ownerId` continues to store the Better Auth user ID.
- Tree names have a backend-generated normalized value.
- Tree-name uniqueness is enforced per owner.
- Tree descriptions are supported.
- A person requires only `firstName`.
- Optional person strings are nullable.
- Gender is stored with `UNKNOWN` default.
- Birth and death dates support year, month, or day precision.
- Relationship type is `PARENT_CHILD` or `SPOUSE`.
- Relationship fields remain `personAId` and `personBId`.
- `PARENT_CHILD` direction is explicitly A=parent, B=child.
- `SPOUSE` pairs are normalized by the backend.
- Current routes remain available.
- The current frontend continues to compile and render the tree.

---

## In Scope

### Prisma and database

- Refactor `Tree`.
- Refactor `Person`.
- Refactor `Relationship`.
- Add `Gender`.
- Add `DatePrecision`.
- Rename `PARENT` to `PARENT_CHILD`.
- Add relationship timestamps.
- Create a destructive pre-production migration/reset.
- Regenerate Prisma client.
- Preserve Better Auth models without alteration.

### Backend

- Add a reusable tree-name normalization function.
- Update tree validators and controllers.
- Update person validators and controllers.
- Add partial-date validation utilities.
- Update relationship validators and service.
- Update graph response usage as required.
- Update TypeScript input/response types.
- Preserve authentication and ownership middleware.
- Preserve current route paths.

### Frontend compatibility

Only make changes required for:

- optional `lastName`
- `biography`
- partial-date fields
- `PARENT_CHILD`
- relationship semantics using `personAId`/`personBId`
- current graph rendering

No visual redesign is included.

### Tests

- Add focused unit tests for normalization and partial-date functions.
- Update backend integration tests.
- Update test fixtures.
- Keep auth regression coverage.
- Add cross-user ownership regression coverage.
- Perform a minimal manual application smoke test.

---

## Out of Scope

Do not include:

- `/persons` to `/people` route rename
- `/graph` to `/full` route rename
- public share links
- `ShareLink` model
- public tree page
- final error response envelope
- complete relationship-rule overhaul
- search
- manual visual positioning
- React Flow redesign
- responsive UI redesign
- Tailwind/shadcn migration
- deployment or staging setup
- import/export
- collaboration

---

## Target Prisma Schema

```prisma
model Tree {
  id             String   @id @default(uuid())
  ownerId        String
  name           String
  normalizedName String
  description    String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  persons       Person[]
  relationships Relationship[]

  @@unique([ownerId, normalizedName])
  @@index([ownerId])
}

model Person {
  id String @id @default(uuid())

  treeId String
  tree   Tree   @relation(fields: [treeId], references: [id], onDelete: Cascade)

  firstName String
  lastName  String?
  gender    Gender @default(UNKNOWN)

  birthDate          String?
  birthDatePrecision DatePrecision?
  deathDate          String?
  deathDatePrecision DatePrecision?

  birthPlace String?
  biography  String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  relationshipsA Relationship[] @relation("A")
  relationshipsB Relationship[] @relation("B")

  @@index([treeId])
}

model Relationship {
  id String @id @default(uuid())

  treeId String
  tree   Tree   @relation(fields: [treeId], references: [id], onDelete: Cascade)

  personAId String
  personBId String

  personA Person @relation("A", fields: [personAId], references: [id], onDelete: Cascade)
  personB Person @relation("B", fields: [personBId], references: [id], onDelete: Cascade)

  type RelationshipType

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([treeId, personAId, personBId, type])
  @@index([treeId])
  @@index([personAId])
  @@index([personBId])
}

enum Gender {
  MALE
  FEMALE
  OTHER
  UNKNOWN
}

enum DatePrecision {
  YEAR
  MONTH
  DAY
}

enum RelationshipType {
  PARENT_CHILD
  SPOUSE
}
```

Prisma relation-array names may be adjusted if necessary, but API/domain field names and semantics must remain unchanged.

---

## Tree Design

### Fields

```txt
id
ownerId
name
normalizedName
description
createdAt
updatedAt
```

### Normalization

The backend generates `normalizedName`.

Recommended normalization:

1. trim leading/trailing whitespace
2. collapse consecutive internal whitespace to one space
3. lowercase the result

Example:

```txt
"  The   Cohen Family  "
→ name: "The Cohen Family"
→ normalizedName: "the cohen family"
```

Store the cleaned display name as `name`, not the original untrimmed value.

### Uniqueness

Enforce:

```prisma
@@unique([ownerId, normalizedName])
```

Different owners may use the same name. The same owner may not create case/whitespace variants of the same name.

The backend should translate the uniqueness failure into the current project error style. Final V1 error-envelope work remains deferred.

---

## Person Design

Required:

```txt
firstName
```

Optional:

```txt
lastName
gender
birthDate
birthDatePrecision
deathDate
deathDatePrecision
birthPlace
biography
```

`gender` defaults to `UNKNOWN`.

Empty optional strings become `null`.

Length limits:

```txt
firstName: 100
lastName: 100
birthPlace: 150
biography: 2000
```

Duplicate people are allowed. The system must not silently merge them.

---

## Partial-Date Design

### Representation

```txt
YEAR  → 2020
MONTH → 2020-04
DAY   → 2020-04-17
```

Examples:

```json
{
  "birthDate": "1992",
  "birthDatePrecision": "YEAR"
}
```

```json
{
  "birthDate": "1992-08",
  "birthDatePrecision": "MONTH"
}
```

```json
{
  "birthDate": "1992-08-14",
  "birthDatePrecision": "DAY"
}
```

Invalid combinations include a date without precision, precision without date, or a value whose format does not match precision.

### Validation utilities

Create focused functions, conceptually:

```txt
parsePartialDate
validatePartialDate
partialDateToRange
comparePartialDateRanges
```

A partial date is treated as a range for comparison only:

```txt
1992
→ 1992-01-01 through 1992-12-31

1992-08
→ 1992-08-01 through 1992-08-31

1992-08-14
→ one exact day
```

Do not persist invented month/day components.

### Birth/death ordering

Reject only when death is conclusively before birth.

```txt
birth: 2000 YEAR
death: 1999-12-31 DAY
→ invalid
```

```txt
birth: 2000 YEAR
death: 2000-01 MONTH
→ overlapping ranges; not conclusively invalid
```

---

## Relationship Design

### Types

```txt
PARENT_CHILD
SPOUSE
```

### `PARENT_CHILD`

Ordering is meaningful:

```txt
personAId = parent
personBId = child
```

Use this consistently in validation, service methods, persistence, graph transformation, tests, and frontend creation.

Do not sort parent-child IDs.

### `SPOUSE`

Ordering is not meaningful.

Before duplicate lookup or persistence, normalize the pair into stable order. Lexicographic ID sorting is acceptable.

This prevents `A/B` and `B/A` from becoming separate spouse rows.

## Relationship Validation in This Phase

Required:

- authenticated tree ownership
- both people exist
- both people belong to the route tree
- no self-relationship
- exact duplicate rejection
- parent-child direction preservation
- spouse normalization

Advanced rules remain scheduled for the relationship-service phase:

- spouse/parent-child pair conflict
- max one spouse
- max two parents
- complete ancestor-cycle detection
- final conflict error codes

Existing compatible checks should not be removed merely because they are scheduled for later.

---

## Ownership and Security

Every private nested operation should:

1. authenticate with Better Auth
2. load the tree using both route `treeId` and authenticated `ownerId`
3. perform person/relationship operations inside that tree boundary

Never:

- accept `ownerId` from request input
- accept `normalizedName` from request input
- trust a person ID without checking its `treeId`
- create a relationship across trees
- query globally and assume ownership afterward
- expose Better Auth account/session data

Tree-name uniqueness must be scoped to `ownerId`.

---

## Migration Strategy

The project is pre-production and the database may be reset.

Recommended process:

1. update Prisma schema
2. reset/create migrations
3. regenerate Prisma client
4. update fixtures and test setup
5. update backend code
6. update minimal frontend compatibility
7. run all validation

Do not create complicated transitional columns or backfills for prototype data unless preserving that data becomes an explicit requirement.

---

## Implementation Order

1. Implement and test domain utilities:
   - tree-name normalization
   - optional-string normalization
   - partial-date validation/range comparison
   - spouse pair normalization
2. Update Prisma schema and migration.
3. Regenerate Prisma client.
4. Update backend types and validators.
5. Update tree logic.
6. Update person logic.
7. Update relationship logic.
8. Update graph and minimal frontend compatibility.
9. Run tests and manual smoke verification.

Do not mark the phase complete based only on compilation.

---

## Files Likely Affected

Backend:

```txt
backend/prisma/schema.prisma
backend/prisma/migrations/*
backend/src/controllers/treeController.ts
backend/src/controllers/personController.ts
backend/src/controllers/relationshipController.ts
backend/src/controllers/graphController.ts
backend/src/services/relationshipService.ts
backend/src/utils/relationshipNormalization.ts
backend/src/validators/treeValidators.ts
backend/src/validators/personValidators.ts
backend/src/validators/relationshipValidators.ts
backend/src/types/*
backend/src/tests/*
```

Possible focused utilities:

```txt
backend/src/domain/tree/normalizeTreeName.ts
backend/src/domain/person/partialDate.ts
backend/src/domain/shared/normalizeOptionalString.ts
```

Use existing project conventions rather than introducing unnecessary architecture solely for this phase.

Frontend compatibility:

```txt
frontend/src/services/treeService.ts
frontend/src/services/personService.ts
frontend/src/services/relationshipService.ts
frontend/src/services/graphService.ts
frontend/src/pages/TreePage.tsx
frontend/src/utils/treeLayout.ts
```

The exact list should be confirmed after inspecting the Phase 2 branch.

---

## Phase Done Criteria

Phase 2 is done when:

- the target Prisma schema is implemented
- Better Auth remains working and unchanged
- migration/reset succeeds
- Prisma client generates
- backend compiles
- frontend builds
- tree names normalize and enforce per-owner uniqueness
- tree description works
- a person can be created without a last name
- gender defaults to `UNKNOWN`
- optional empty strings persist as `null`
- partial dates validate correctly
- death-before-birth validation uses ranges
- `PARENT_CHILD` uses A=parent and B=child
- spouse relationships are normalized
- current graph still renders
- auth and ownership regression tests pass
- cross-user access remains blocked
- no route rename is mixed in
- no sharing work is mixed in
- no final error-envelope refactor is mixed in
- deferred relationship rules are documented clearly
