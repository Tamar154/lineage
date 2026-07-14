# Phase 2 V1 Schema Refactor Checklist

This checklist tracks the V1 domain schema refactor for Tree, Person, and Relationship.

The goal is to establish the agreed V1 persistence model without mixing in later API, sharing, error-format, relationship-rule, or UI phases.

---

## 1. Preparation

- [ ] Read `docs/PRD.md`.
- [ ] Read `docs/API.md`.
- [ ] Read all files under `docs/phase-2-schema/`.
- [ ] Confirm database reset is still acceptable.
- [ ] Confirm no production data must be preserved.
- [ ] Do not start unrelated API/UI/sharing work.

---

## 2. Confirmed Naming Decisions

- [ ] Use `birthDate`.
- [ ] Use `birthDatePrecision`.
- [ ] Use `deathDate`.
- [ ] Use `deathDatePrecision`.
- [ ] Keep `personAId` and `personBId`.
- [ ] Keep Prisma relations `personA` and `personB`.
- [ ] Rename `PARENT` to `PARENT_CHILD`.
- [ ] Document `PARENT_CHILD`: A = parent, B = child.
- [ ] Document `SPOUSE`: A/B has no domain meaning and is normalized.

---

## 3. Prisma Tree Schema

- [ ] Keep `id`.
- [ ] Keep `ownerId String`.
- [ ] Keep `name`.
- [ ] Add `normalizedName String`.
- [ ] Add `description String?`.
- [ ] Keep timestamps.
- [ ] Add `@@unique([ownerId, normalizedName])`.
- [ ] Keep `@@index([ownerId])`.
- [ ] Do not add a Prisma relation from Tree to Better Auth User.
- [ ] Confirm a tree may contain zero people.

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

- [ ] Keep `id`.
- [ ] Keep `treeId` relation with cascade delete.
- [ ] Keep `firstName String`.
- [ ] Change `lastName` to `String?`.
- [ ] Add `gender Gender @default(UNKNOWN)`.
- [ ] Replace `birthDate DateTime?` with `birthDate String?`.
- [ ] Add `birthDatePrecision DatePrecision?`.
- [ ] Replace `deathDate DateTime?` with `deathDate String?`.
- [ ] Add `deathDatePrecision DatePrecision?`.
- [ ] Add `birthPlace String?`.
- [ ] Rename `bio` to `biography String?`.
- [ ] Keep timestamps.
- [ ] Keep relationship arrays using `"A"` and `"B"`.
- [ ] Keep `@@index([treeId])`.

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

- [ ] Keep `id`.
- [ ] Keep `treeId` relation with cascade delete.
- [ ] Keep `personAId`.
- [ ] Keep `personBId`.
- [ ] Keep `personA` relation `"A"`.
- [ ] Keep `personB` relation `"B"`.
- [ ] Change enum value `PARENT` to `PARENT_CHILD`.
- [ ] Add `createdAt`.
- [ ] Add `updatedAt`.
- [ ] Keep exact ordered unique constraint.
- [ ] Keep indexes.
- [ ] Do not add a second direct relationship-creation path.

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

- [ ] Add `Gender`.
- [ ] Add `DatePrecision`.
- [ ] Update `RelationshipType`.

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

- [ ] Create a destructive pre-production migration/reset.
- [ ] Document that no production-data migration is included.
- [ ] Confirm Better Auth tables remain unchanged.
- [ ] Run Prisma schema validation.
- [ ] Apply/reset the development database.
- [ ] Apply/reset the test database.
- [ ] Generate Prisma client.
- [ ] Do not manually edit generated client files.
- [ ] Confirm backend imports still use the custom generated Prisma path.

---

## 8. Tree Domain Logic

- [ ] Add one reusable tree-name normalization function.
- [ ] Trim display name.
- [ ] Collapse repeated internal whitespace.
- [ ] Lowercase normalized name.
- [ ] Do not accept `normalizedName` from client.
- [ ] Do not accept `ownerId` from client.
- [ ] Set `ownerId` from Better Auth session.
- [ ] Enforce name required.
- [ ] Enforce name maximum 100.
- [ ] Normalize description.
- [ ] Store empty description as `null`.
- [ ] Enforce description maximum 500.
- [ ] Handle per-owner unique constraint.
- [ ] Allow different owners to use the same normalized name.

---

## 9. Person Domain Logic

- [ ] Enforce required `firstName`.
- [ ] Trim `firstName`.
- [ ] Enforce first name maximum 100.
- [ ] Make `lastName` optional.
- [ ] Store empty last name as `null`.
- [ ] Enforce last name maximum 100.
- [ ] Default omitted gender to `UNKNOWN`.
- [ ] Validate gender enum.
- [ ] Add optional birth place.
- [ ] Store empty birth place as `null`.
- [ ] Enforce birth place maximum 150.
- [ ] Add optional biography.
- [ ] Store empty biography as `null`.
- [ ] Enforce biography maximum 2000.
- [ ] Continue allowing duplicate people.

---

## 10. Partial-Date Domain Logic

- [ ] Add focused partial-date utility/module.
- [ ] Support `YEAR` format `YYYY`.
- [ ] Support `MONTH` format `YYYY-MM`.
- [ ] Support `DAY` format `YYYY-MM-DD`.
- [ ] Require date and precision together.
- [ ] Validate real month values.
- [ ] Validate real calendar days.
- [ ] Handle leap years.
- [ ] Reject future dates.
- [ ] Convert partial dates to ranges for comparison.
- [ ] Reject conclusively invalid death-before-birth.
- [ ] Allow overlapping uncertain ranges.
- [ ] Do not persist invented month/day values.
- [ ] Support clearing date and precision together.
- [ ] Prevent partial updates from leaving an invalid half-pair.

---

## 11. Relationship Domain Logic

- [ ] Route all relationship creation through relationship service.
- [ ] Validate authenticated tree ownership.
- [ ] Validate both people exist.
- [ ] Validate both people belong to route tree.
- [ ] Reject self-relationship.
- [ ] For `PARENT_CHILD`, keep A=parent and B=child.
- [ ] Do not sort `PARENT_CHILD` IDs.
- [ ] For `SPOUSE`, normalize A/B pair to stable order.
- [ ] Check duplicate after spouse normalization.
- [ ] Reject exact duplicate `PARENT_CHILD`.
- [ ] Preserve delete-relationship behavior.
- [ ] Confirm deleting a relationship leaves people.
- [ ] Confirm deleting a person cascades A-side relationships.
- [ ] Confirm deleting a person cascades B-side relationships.
- [ ] Do not turn this phase into the complete relationship-rule rewrite.

---

## 12. Backend Types, Validators, and Controllers

- [ ] Update tree input/output types.
- [ ] Update person input/output types.
- [ ] Update relationship input/output types.
- [ ] Update tree validator.
- [ ] Update person validator.
- [ ] Update relationship validator.
- [ ] Update tree controller/service.
- [ ] Update person controller/service.
- [ ] Update relationship controller/service.
- [ ] Update graph controller/response.
- [ ] Remove assumptions that last name is required.
- [ ] Remove assumptions that dates are `DateTime`.
- [ ] Remove assumptions that type is `PARENT`.
- [ ] Keep current route paths.
- [ ] Keep current error style for now.

---

## 13. Security and Ownership

- [ ] Every private route still uses `requireAuth`.
- [ ] Every nested route validates tree ownership.
- [ ] No request may override `ownerId`.
- [ ] No request may override `normalizedName`.
- [ ] Person IDs are checked against route tree.
- [ ] Relationship person IDs are checked against route tree.
- [ ] Cross-tree relationships are rejected.
- [ ] Cross-owner access is rejected.
- [ ] Better Auth Account/Session/Verification data is not exposed.
- [ ] Better Auth schema is not changed.
- [ ] Ownership regression tests pass.

---

## 14. Tests

- [ ] Add tree normalization unit tests.
- [ ] Add optional-string normalization tests.
- [ ] Add partial-date shape tests.
- [ ] Add partial-date range tests.
- [ ] Add birth/death comparison tests.
- [ ] Add spouse normalization tests.
- [ ] Update tree integration tests.
- [ ] Update person integration tests.
- [ ] Update relationship integration tests.
- [ ] Update graph tests if present.
- [ ] Keep auth tests passing.
- [ ] Test same-owner normalized duplicate rejection.
- [ ] Test different-owner same-name acceptance.
- [ ] Test person without last name.
- [ ] Test gender default.
- [ ] Test empty optional strings become `null`.
- [ ] Test parent-child A/B direction.
- [ ] Test spouse reverse duplicate rejection.
- [ ] Test cross-tree relationship rejection.
- [ ] Test person cascade deletes relationships.
- [ ] Document unrelated pre-existing failing tests.

---

## 15. Frontend Compatibility

- [ ] Update frontend types as required.
- [ ] Handle optional `lastName`.
- [ ] Avoid displaying `null` or `undefined` in names.
- [ ] Update `bio` usage to `biography`.
- [ ] Update date field assumptions.
- [ ] Update `PARENT` usage to `PARENT_CHILD`.
- [ ] Keep `personAId` and `personBId`.
- [ ] Preserve parent-child direction in graph transformation.
- [ ] Preserve spouse handling.
- [ ] Keep current routes.
- [ ] Keep current UI design.
- [ ] Confirm frontend TypeScript/build passes.

---

## 16. Manual Verification

Backend/API:

- [ ] Start backend.
- [ ] Prisma-backed routes respond.
- [ ] Auth still works.
- [ ] Create normalized tree.
- [ ] Duplicate normalized tree name is rejected.
- [ ] Create empty tree.
- [ ] Create person with first name only.
- [ ] Create person with partial date.
- [ ] Update and clear optional person fields.
- [ ] Create parent-child relationship.
- [ ] Create spouse relationship.
- [ ] Reverse spouse duplicate is rejected.
- [ ] Delete relationship without deleting people.
- [ ] Delete person and confirm connected relationships are removed.

Frontend/browser:

- [ ] Register/login flow still works in browser.
- [ ] Tree dashboard loads.
- [ ] Empty tree opens.
- [ ] Person without last name renders correctly.
- [ ] Parent-child relationship renders correctly.
- [ ] Spouse relationship renders correctly.
- [ ] Current graph pan/zoom/select still works.
- [ ] Logout still works.

Do not check browser items based solely on backend tests.

---

## 17. Phase Completion Gate

Before moving to Phase 3, confirm:

- [ ] Target Tree schema is implemented.
- [ ] Target Person schema is implemented.
- [ ] Target Relationship schema is implemented.
- [ ] `birthDate` and `deathDate` naming is used consistently.
- [ ] `personA`/`personB` naming is used consistently.
- [ ] A=parent/B=child is documented and tested.
- [ ] Spouse normalization is documented and tested.
- [ ] Better Auth remains working.
- [ ] Ownership isolation remains working.
- [ ] Prisma migration/reset succeeds.
- [ ] Backend compiles.
- [ ] Frontend builds.
- [ ] Required tests pass.
- [ ] Manual verification is recorded accurately.
- [ ] No route renames were added.
- [ ] No share-link work was added.
- [ ] No final error-envelope work was added.
- [ ] No full relationship-rule overhaul was added.
