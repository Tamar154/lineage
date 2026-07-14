# Phase 2 V1 Schema Refactor Rules

Read first:

- `docs/PRD.md`
- `docs/API.md`
- `docs/phase-2-schema/phase-2-schema-refactor.md`
- `docs/phase-2-schema/phase-2-schema-testing.md`
- `docs/phase-2-schema/phase-2-schema-checklist.md`

The V1 documents are the source of truth. The current implementation is only evidence of what exists today. Do not infer new requirements from prototype code.

Implement **Phase 2: V1 Domain Schema Refactor** only.

## Confirmed naming decisions

Use these names exactly:

- `birthDate`
- `birthDatePrecision`
- `deathDate`
- `deathDatePrecision`
- `personAId` and `personBId`
- Prisma relations `personA` and `personB`
- relationship type `PARENT_CHILD`

Relationship semantics:

- For `PARENT_CHILD`, `personAId` is the parent and `personBId` is the child.
- For `SPOUSE`, A/B has no domain meaning. The relationship service normalizes the pair into stable order before persistence.
- Never infer direction from gender, display order, or node position.
- All relationship creation must go through the relationship service.

## Scope

1. Refactor LineAge-owned Prisma models: `Tree`, `Person`, and `Relationship`.
2. Add `Gender` and `DatePrecision` enums.
3. Rename relationship type `PARENT` to `PARENT_CHILD`.
4. Keep `personAId` and `personBId`.
5. Add partial-date storage using `birthDate`/`birthDatePrecision` and `deathDate`/`deathDatePrecision`.
6. Add server-generated tree-name normalization.
7. Update backend validators, types, services, controllers, tests, and fixtures as required.
8. Make only minimal frontend compatibility changes needed to compile and keep current behavior.
9. Keep Better Auth unchanged.
10. Keep the repository structure as `backend/` and `frontend/`.

## Out of scope

Do not include:

- `/persons` to `/people` route rename
- `/graph` to `/full` route rename
- `ShareLink` or public sharing
- public tree page
- final API error envelope
- complete relationship-rule overhaul
- final max-one-spouse rule work
- final max-two-parents rule work
- final ancestor-cycle implementation
- frontend or React Flow redesign
- Tailwind/shadcn migration
- search
- deployment
- manual node positioning

## Target schema

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

Do not add a Prisma relation from `Tree.ownerId` to Better Auth's `User` model.

## Tree rules

- `ownerId` comes only from the authenticated Better Auth session.
- Never accept `ownerId` from request input.
- `name` is required, trimmed, and limited to 100 characters.
- `normalizedName` is generated only by the backend.
- Never accept `normalizedName` from request input.
- Normalize by trimming, collapsing repeated whitespace, and lowercasing.
- Tree names are unique per owner by `normalizedName`.
- Different owners may use the same normalized tree name.
- `description` is optional, trimmed, limited to 500 characters, and stored as `null` when empty.
- A tree may contain zero people.
- Keep normalization in one reusable backend function.

## Person rules

- `firstName` is required, trimmed, and limited to 100 characters.
- `lastName` is optional, trimmed, limited to 100 characters, and stored as `null` when empty.
- `gender` defaults to `UNKNOWN`.
- `birthPlace` is optional, trimmed, limited to 150 characters, and stored as `null` when empty.
- `biography` is optional, trimmed, limited to 2000 characters, and stored as `null` when empty.
- Duplicate people are allowed.
- Gender does not determine relationship validity.
- Deleting a person must cascade-delete connected relationships.

## Partial-date rules

Store dates as strings:

- `YEAR` → `YYYY`
- `MONTH` → `YYYY-MM`
- `DAY` → `YYYY-MM-DD`

Rules:

- Date and precision must either both be present or both be `null`.
- Do not invent missing month/day values.
- Validate real calendar months and days.
- Reject future dates.
- Reject death before birth only when partial-date ranges prove it conclusively.
- Treat partial dates as ranges for comparison.
- If ranges overlap and ordering is uncertain, do not reject solely based on string order.
- Clearing a date must clear its precision too.
- Keep parsing, validation, and comparison in focused utility/domain functions with unit tests.

## Relationship rules for this phase

Required:

- authenticate and validate tree ownership
- validate both people exist
- validate both people belong to the route tree
- reject self-relationships
- for `PARENT_CHILD`, persist A=parent and B=child without sorting
- for `SPOUSE`, normalize A/B before duplicate lookup and creation
- reject exact duplicates
- route all creation through the relationship service
- deleting a relationship leaves both people
- deleting a person removes A-side and B-side relationships

Advanced final V1 relationship rules belong to the later relationship-service phase. Preserve existing checks when compatible, but do not turn Phase 2 into the complete rule-engine rewrite.

## Ownership and security rules

- Every private operation derives identity from Better Auth session data.
- Load the tree using both `treeId` and authenticated `ownerId` before nested operations.
- Never trust `treeId`, `personAId`, or `personBId` merely because they are valid IDs.
- Reject cross-tree and cross-owner relationships.
- Do not expose Better Auth `Account`, `Session`, or `Verification` data.
- Do not change Better Auth tables.
- Do not accept Prisma relation objects from client input.
- Preserve cross-user isolation tests.

## Compatibility rules

Keep current routes during Phase 2:

- `/api/trees`
- `/api/trees/:treeId/persons`
- `/api/trees/:treeId/relationships`
- `/api/trees/:treeId/graph`

Minimal frontend updates are allowed for:

- optional `lastName`
- `biography`
- partial-date fields
- `PARENT_CHILD`
- `personAId` and `personBId`

Do not rename routes or redesign the UI.

## Migration rules

- This is a pre-production destructive migration.
- Database reset is allowed.
- Document that no production-data migration is included.
- Preserve Better Auth tables and compatibility.
- Regenerate the Prisma client.
- Do not edit generated Prisma files manually.

## Checklist and validation

Update `docs/phase-2-schema/phase-2-schema-checklist.md` as work is completed.

Only check off verified work. Do not describe compilation as runtime verification or API smoke tests as browser verification.

Verify:

- Prisma schema validates
- development and test database reset/migration succeeds
- Prisma client generates
- backend compiles
- frontend builds
- auth regression tests pass
- tree, person, and relationship tests pass for the new schema
- current graph still renders
- ownership isolation remains intact
- no unrelated V1 feature is added

If a product requirement is missing, do not infer it from prototype code. Document the missing decision and ask before implementing it.
