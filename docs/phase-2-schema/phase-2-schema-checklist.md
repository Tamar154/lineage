# Phase 2 V1 Schema Refactor Checklist

This checklist tracks the V1 domain schema refactor for Tree, Person, and Relationship.

The goal is to establish the agreed V1 persistence model without mixing in later API, sharing, error-format, relationship-rule, or UI phases.

---

## 1. Preparation

- [x] Read `docs/PRD.md`.
- [x] Read `docs/API.md`.
- [x] Read all files under `docs/phase-2-schema/`.
- [x] Confirm database reset is still acceptable.
- [x] Confirm no production data must be preserved.
- [x] Do not start unrelated API/UI/sharing work.

---

## 2. Confirmed Naming Decisions

- [x] Use `birthDate`.
- [x] Use `birthDatePrecision`.
- [x] Use `deathDate`.
- [x] Use `deathDatePrecision`.
- [x] Keep `personAId` and `personBId`.
- [x] Keep Prisma relations `personA` and `personB`.
- [x] Rename `PARENT` to `PARENT_CHILD`.
- [x] Document `PARENT_CHILD`: A = parent, B = child.
- [x] Document `SPOUSE`: A/B has no domain meaning and is normalized.

---

## 3. Prisma Tree Schema

- [x] Keep `id`.
- [x] Keep `ownerId String`.
- [x] Keep `name`.
- [x] Add `normalizedName String`.
- [x] Add `description String?`.
- [x] Keep timestamps.
- [x] Add `@@unique([ownerId, normalizedName])`.
- [x] Keep `@@index([ownerId])`.
- [x] Do not add a Prisma relation from Tree to Better Auth User.
- [x] Confirm a tree may contain zero people.

Target:

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
```

---

## 4. Prisma Person Schema

- [x] Keep `id`.
- [x] Keep `treeId` relation with cascade delete.
- [x] Keep `firstName String`.
- [x] Change `lastName` to `String?`.
- [x] Add `gender Gender @default(UNKNOWN)`.
- [x] Replace `birthDate DateTime?` with `birthDate String?`.
- [x] Add `birthDatePrecision DatePrecision?`.
- [x] Replace `deathDate DateTime?` with `deathDate String?`.
- [x] Add `deathDatePrecision DatePrecision?`.
- [x] Add `birthPlace String?`.
- [x] Rename `bio` to `biography String?`.
- [x] Keep timestamps.
- [x] Keep relationship arrays using `"A"` and `"B"`.
- [x] Keep `@@index([treeId])`.

Target:

```prisma
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
```

---

## 5. Prisma Relationship Schema

- [x] Keep `id`.
- [x] Keep `treeId` relation with cascade delete.
- [x] Keep `personAId`.
- [x] Keep `personBId`.
- [x] Keep `personA` relation `"A"`.
- [x] Keep `personB` relation `"B"`.
- [x] Change enum value `PARENT` to `PARENT_CHILD`.
- [x] Add `createdAt`.
- [x] Add `updatedAt`.
- [x] Keep exact ordered unique constraint.
- [x] Keep indexes.
- [x] Do not add a second direct relationship-creation path.

Target:

```prisma
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
```

---

## 6. Prisma Enums

- [x] Add `Gender`.
- [x] Add `DatePrecision`.
- [x] Update `RelationshipType`.

```prisma
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

---

## 7. Migration and Prisma Client

- [x] Create a destructive pre-production migration/reset.
- [x] Document that no production-data migration is included.
- [x] Confirm Better Auth tables remain unchanged.
- [x] Run Prisma schema validation.
- [x] Apply/reset the development database.

Migration verification note (2026-07-14): the development database reports all three checked-in migrations applied and the schema up to date. The dedicated test database was successfully force-reset to the checked-in Prisma schema.

- [x] Apply/reset the test database.
- [x] Generate Prisma client.
- [x] Do not manually edit generated client files.
- [x] Confirm backend imports still use the custom generated Prisma path.

---

## 8. Tree Domain Logic

- [x] Add one reusable tree-name normalization function.
- [x] Trim display name.
- [x] Collapse repeated internal whitespace.
- [x] Lowercase normalized name.
- [x] Do not accept `normalizedName` from client.
- [x] Do not accept `ownerId` from client.
- [x] Set `ownerId` from Better Auth session.
- [x] Enforce name required.
- [x] Enforce name maximum 100.
- [x] Normalize description.
- [x] Store empty description as `null`.
- [x] Enforce description maximum 500.
- [x] Handle per-owner unique constraint.
- [x] Allow different owners to use the same normalized name.

---

## 9. Person Domain Logic

- [x] Enforce required `firstName`.
- [x] Trim `firstName`.
- [x] Enforce first name maximum 100.
- [x] Make `lastName` optional.
- [x] Store empty last name as `null`.
- [x] Enforce last name maximum 100.
- [x] Default omitted gender to `UNKNOWN`.
- [x] Validate gender enum.
- [x] Add optional birth place.
- [x] Store empty birth place as `null`.
- [x] Enforce birth place maximum 150.
- [x] Add optional biography.
- [x] Store empty biography as `null`.
- [x] Enforce biography maximum 2000.
- [x] Continue allowing duplicate people.

---

## 10. Partial-Date Domain Logic

- [x] Add focused partial-date utility/module.
- [x] Support `YEAR` format `YYYY`.
- [x] Support `MONTH` format `YYYY-MM`.
- [x] Support `DAY` format `YYYY-MM-DD`.
- [x] Require date and precision together.
- [x] Validate real month values.
- [x] Validate real calendar days.
- [x] Handle leap years.
- [x] Reject future dates.
- [x] Convert partial dates to ranges for comparison.
- [x] Reject conclusively invalid death-before-birth.
- [x] Allow overlapping uncertain ranges.
- [x] Do not persist invented month/day values.
- [x] Support clearing date and precision together.
- [x] Prevent partial updates from leaving an invalid half-pair.

---

## 11. Relationship Domain Logic

- [x] Route all relationship creation through relationship service.
- [x] Validate authenticated tree ownership.
- [x] Validate both people exist.
- [x] Validate both people belong to route tree.
- [x] Reject self-relationship.
- [x] For `PARENT_CHILD`, keep A=parent and B=child.
- [x] Do not sort `PARENT_CHILD` IDs.
- [x] For `SPOUSE`, normalize A/B pair to stable order.
- [x] Check duplicate after spouse normalization.
- [x] Reject exact duplicate `PARENT_CHILD`.
- [x] Preserve delete-relationship behavior.
- [x] Confirm deleting a relationship leaves people.
- [x] Confirm deleting a person cascades A-side relationships.
- [x] Confirm deleting a person cascades B-side relationships.
- [x] Do not turn this phase into the complete relationship-rule rewrite.

---

## 12. Backend Types, Validators, and Controllers

- [x] Update tree input/output types.
- [x] Update person input/output types.
- [x] Update relationship input/output types.
- [x] Update tree validator.
- [x] Update person validator.
- [x] Update relationship validator.
- [x] Update tree controller/service.
- [x] Update person controller/service.
- [x] Update relationship controller/service.
- [x] Update graph controller/response.
- [x] Remove assumptions that last name is required.
- [x] Remove assumptions that dates are `DateTime`.
- [x] Remove assumptions that type is `PARENT`.
- [x] Keep current route paths.
- [x] Keep current error style for now.

---

## 13. Security and Ownership

- [x] Every private route still uses `requireAuth`.
- [x] Every nested route validates tree ownership.
- [x] No request may override `ownerId`.
- [x] No request may override `normalizedName`.
- [x] Person IDs are checked against route tree.
- [x] Relationship person IDs are checked against route tree.
- [x] Cross-tree relationships are rejected.
- [x] Cross-owner access is rejected.
- [x] Better Auth Account/Session/Verification data is not exposed.
- [x] Better Auth schema is not changed.
- [x] Ownership regression tests pass.

---

## 14. Tests

- [x] Add tree normalization unit tests.
- [x] Add optional-string normalization tests.
- [x] Add partial-date shape tests.
- [x] Add partial-date range tests.
- [x] Add birth/death comparison tests.
- [x] Add spouse normalization tests.
- [x] Update tree integration tests.
- [x] Update person integration tests.
- [x] Update relationship integration tests.
- [x] Update graph tests if present.
- [x] Keep auth tests passing.
- [x] Test same-owner normalized duplicate rejection.
- [x] Test different-owner same-name acceptance.
- [x] Test person without last name.
- [x] Test gender default.
- [x] Test empty optional strings become `null`.
- [x] Test parent-child A/B direction.
- [x] Test spouse reverse duplicate rejection.
- [x] Test cross-tree relationship rejection.
- [x] Test person cascade deletes relationships.
- [x] Document unrelated pre-existing failing tests.

Verification note (2026-07-14): all 52 backend tests pass. Repository-wide backend lint still has pre-existing unsafe-`any` findings in Supertest tests and middleware typing; lint is not part of the Phase 2 completion gate.

---

## 15. Frontend Compatibility

- [x] Update frontend types as required.
- [x] Handle optional `lastName`.
- [x] Avoid displaying `null` or `undefined` in names.
- [x] Update `bio` usage to `biography`.
- [x] Update date field assumptions.
- [x] Update `PARENT` usage to `PARENT_CHILD`.
- [x] Keep `personAId` and `personBId`.
- [x] Preserve parent-child direction in graph transformation.
- [x] Preserve spouse handling.
- [x] Keep current routes.
- [x] Keep current UI design.
- [x] Confirm frontend TypeScript/build passes.

---

## 16. Manual Verification

Backend/API:

- [x] Start backend.
- [x] Prisma-backed routes respond.
- [x] Auth still works.
- [x] Create normalized tree.
- [x] Duplicate normalized tree name is rejected.
- [x] Create empty tree.
- [x] Create person with first name only.
- [x] Create person with partial date.
- [x] Update and clear optional person fields.
- [x] Create parent-child relationship.
- [x] Create spouse relationship.
- [x] Reverse spouse duplicate is rejected.
- [x] Delete relationship without deleting people.
- [x] Delete person and confirm connected relationships are removed.

Backend/API smoke note (2026-07-14): verified against a running backend using the dedicated test database. The smoke records were cleaned up after verification.

Frontend/browser:

- [x] Register/login flow still works in browser.
- [x] Tree dashboard loads.
- [x] Empty tree opens.
- [x] Person without last name renders correctly.
- [x] Parent-child relationship renders correctly.
- [x] Spouse relationship renders correctly.
- [x] Current graph pan/zoom/select still works.
- [x] Logout still works.

Do not check browser items based solely on backend tests.

---

## 17. Phase Completion Gate

Before moving to Phase 3, confirm:

- [x] Target Tree schema is implemented.
- [x] Target Person schema is implemented.
- [x] Target Relationship schema is implemented.
- [x] `birthDate` and `deathDate` naming is used consistently.
- [x] `personA`/`personB` naming is used consistently.
- [x] A=parent/B=child is documented and tested.
- [x] Spouse normalization is documented and tested.
- [x] Better Auth remains working.
- [x] Ownership isolation remains working.
- [x] Prisma migration/reset succeeds.
- [x] Backend compiles.
- [x] Frontend builds.
- [x] Required tests pass.
- [x] Manual verification is recorded accurately.
- [x] No route renames were added.
- [x] No share-link work was added.
- [x] No final error-envelope work was added.
- [x] No full relationship-rule overhaul was added.
