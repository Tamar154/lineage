# Phase 2 V1 Schema Testing Plan

This document defines the test plan for the V1 domain schema refactor.

The goal is to verify the new Tree, Person, partial-date, and Relationship persistence model without turning Phase 2 into the full V1 API or relationship-rule phase.

---

## Scope

This phase tests:

- tree-name normalization
- per-owner tree-name uniqueness
- tree description
- optional person fields
- gender default and enum validation
- partial birth/death dates
- birth/death ordering
- relationship type `PARENT_CHILD`
- `personAId`/`personBId` semantics
- spouse pair normalization
- database cascades
- ownership isolation
- current graph/frontend compatibility
- auth regression after schema changes

This phase does not fully test:

- final API error envelope
- public sharing
- public tree pages
- final `/people` and `/full` routes
- max-one-spouse rule
- max-two-parents rule
- complete ancestor-cycle detection
- complete relationship pair-conflict rules
- final React Flow layout behavior
- search

---

## Test Layers

Use:

1. focused unit tests for deterministic domain utilities
2. PostgreSQL integration tests for persistence and ownership
3. frontend build and targeted manual smoke verification
4. existing auth regression tests

Playwright E2E may be deferred until a later phase unless already configured and inexpensive to use.

---

## Test Data Principles

- Use unique generated emails for auth users.
- Use unique tree names unless a test is specifically about duplicates.
- Create records through public service/API behavior when testing integration.
- Use direct Prisma setup only when testing constraints or improving setup clarity.
- Do not bypass the relationship service in relationship behavior tests.
- Clean tables in foreign-key-safe order.
- Do not delete Better Auth users before sessions/accounts.
- Keep tests deterministic and independent.

---

## Required Unit Tests

### Tree-name normalization

Test:

```txt
" Cohen Family " → "cohen family"
"The   Cohen   Family" → "the cohen family"
mixed case → lowercase
tabs/newlines/repeated whitespace → single spaces
```

Also verify the cleaned display name if the utility returns both display and normalized values.

Acceptance:

- behavior is deterministic
- normalization exists in one place
- controller and tests do not contain duplicate normalization algorithms

---

### Optional-string normalization

Test:

```txt
undefined → omitted according to update semantics
null → null when allowed
"" → null
"   " → null
" Tamar " → "Tamar"
```

Distinguish:

- omitted field means “not supplied”
- explicit empty optional string means `null`

---

### Partial-date shape validation

Valid:

```txt
YEAR: 1990
MONTH: 1990-01
DAY: 1990-01-31
```

Invalid:

```txt
YEAR: 1990-01
MONTH: 1990
MONTH: 1990-13
DAY: 1990-02-30
DAY: 1990-1-2
date without precision
precision without date
```

Acceptance:

- invalid combinations are rejected before persistence
- leap years are handled
- formatting is strict and predictable

---

### Partial-date range conversion

Verify:

```txt
1990 YEAR
→ 1990-01-01 through 1990-12-31

1990-02 MONTH
→ 1990-02-01 through 1990-02-28

2000-02 MONTH
→ 2000-02-01 through 2000-02-29

1990-02-10 DAY
→ exact date
```

---

### Birth/death comparison

Conclusive invalid case:

```txt
birth 2000 YEAR
death 1999-12-31 DAY
→ reject
```

Overlapping/uncertain case:

```txt
birth 2000 YEAR
death 2000-01 MONTH
→ do not reject solely due to partial precision
```

Valid case:

```txt
birth 2000-03 MONTH
death 2020 YEAR
→ accept
```

Test future-date rejection for every precision.

---

### Spouse normalization

Given two IDs:

```txt
normalize(A, B)
normalize(B, A)
```

must produce the same stored pair.

Test self-pair rejection separately. Normalization must not make a self-relationship valid.

---

## Required Backend Integration Tests

### 1. Tree creation stores normalized data

Input:

```json
{
  "name": "  The   Cohen Family  ",
  "description": "  Main family tree  "
}
```

Acceptance:

```txt
name = "The Cohen Family"
normalizedName = "the cohen family"
description = "Main family tree"
ownerId = authenticated Better Auth user ID
```

The client cannot override `ownerId` or `normalizedName`.

---

### 2. Same owner cannot create normalized duplicate

Create:

```txt
"Cohen Family"
" cohen   family "
```

Acceptance:

- second request fails
- only one tree exists for that owner
- current project error style is used until the later error-envelope phase

---

### 3. Different owners may use the same normalized name

User A and User B both create:

```txt
"Cohen Family"
```

Acceptance:

- both succeed
- each owner sees only their own tree

---

### 4. Tree description behavior

Test:

- omitted → `null`
- empty string → `null`
- trimmed non-empty value persists
- more than 500 characters is rejected

---

### 5. Person requires first name only

Input:

```json
{
  "firstName": "Tamar"
}
```

Acceptance:

- succeeds
- `lastName = null`
- `gender = UNKNOWN`
- optional fields are `null`

---

### 6. Person field normalization and limits

Test:

- first name is trimmed
- empty required first name is rejected
- empty last name becomes `null`
- empty birth place becomes `null`
- empty biography becomes `null`
- each maximum length is enforced
- duplicate people are allowed

---

### 7. Gender validation

Test each valid value:

```txt
MALE
FEMALE
OTHER
UNKNOWN
```

Reject unknown values.

Verify omitted gender persists as `UNKNOWN`.

---

### 8. Partial birth-date persistence

Test valid year, month, and day precision.

Acceptance:

- exact input string persists
- exact precision persists
- no fabricated month/day is stored

---

### 9. Partial death date and birth/death validation

Test:

- valid death after birth
- conclusive death-before-birth rejection
- overlapping uncertain partial dates accepted
- future dates rejected

---

### 10. Person update semantics

Verify:

- omitted optional field remains unchanged
- explicit empty optional string becomes `null`
- changing a date requires matching precision
- clearing a date clears both date and precision
- invalid partial update cannot persist half of a pair

---

### 11. Parent-child direction

Create:

```txt
parent = A
child = B
type = PARENT_CHILD
```

Acceptance:

```txt
personAId = A
personBId = B
type = PARENT_CHILD
```

Reverse input represents the opposite directed relationship. Do not silently sort parent-child IDs.

---

### 12. Spouse normalization and duplicate prevention

Create spouse:

```txt
A, B
```

Then try:

```txt
B, A
```

Acceptance:

- both map to the same normalized pair
- reverse duplicate is rejected
- only one spouse row exists for the pair/type

Do not assert max-one-spouse unless that rule is intentionally retained in this phase.

---

### 13. Self-relationship rejection

For both relationship types:

```txt
personAId = personBId
```

must fail.

---

### 14. Cross-tree relationship rejection

Given two people in different trees, relationship creation must fail even when both trees belong to the same user.

---

### 15. Cross-owner relationship rejection

A user must not create a relationship using a person from another user's tree.

Avoid revealing private person data in the response.

---

### 16. Exact duplicate parent-child rejection

Creating the same directed `PARENT_CHILD` twice must fail.

Do not treat the reverse direction as the same relationship through normalization. Other domain rules may reject it later, but normalization must not erase direction.

---

### 17. Relationship deletion behavior

Deleting a relationship:

- deletes only the relationship
- leaves both people
- remains owner-scoped

---

### 18. Person cascade behavior

Deleting a person:

- deletes relationships where the person is A
- deletes relationships where the person is B
- leaves unrelated people and relationships

---

### 19. Tree cascade behavior

Deleting a tree:

- deletes its people
- deletes its relationships
- does not affect another owner's tree
- does not delete the Better Auth user

---

### 20. Graph/current aggregate behavior

The current graph endpoint must return the refactored data without crashing.

Acceptance:

- optional last names are handled safely
- relationships use `PARENT_CHILD`
- relationship IDs remain `personAId` and `personBId`
- the current frontend graph renders after minimal compatibility updates

---

## Ownership Regression Tests

Retain or add:

- unauthenticated private request → `401`
- User A lists only User A trees
- User B cannot read User A tree
- User B cannot create/update/delete User A person
- User B cannot create/delete User A relationship
- route `treeId` is always validated against authenticated `ownerId`

These are security tests, not only CRUD tests.

---

## Auth Regression Tests

After the schema reset/refactor, confirm:

- email/password signup still works
- email/password login still works
- Google provider configuration still initializes
- session-protected routes still work
- logout invalidates private access
- Better Auth tables were not unintentionally changed

Automated tests should not call real Google OAuth.

---

## Frontend Build Verification

Required:

```txt
frontend TypeScript build passes
Vite build passes
```

Check all assumptions that `lastName` is always present.

Avoid display output such as:

```txt
First null
First undefined
```

Expected:

```txt
firstName only when lastName is absent
firstName + lastName when present
```

---

## Frontend Manual Smoke Verification

Do not mark these complete based only on API tests.

### Trees

1. Log in.
2. Create a tree.
3. Confirm it appears.
4. Try a duplicate name with different case/whitespace.
5. Confirm duplicate is rejected.
6. Open an empty tree.

### People

1. Add a person with first name only.
2. Add a person with all optional data.
3. Edit optional fields.
4. Clear optional fields.
5. Confirm details do not show `null` or `undefined`.

### Relationships

1. Create a parent-child relationship.
2. Confirm displayed direction remains correct.
3. Create a spouse relationship.
4. Confirm reverse duplicate cannot be created.
5. Delete the relationship and confirm people remain.

### Graph

1. Open the tree graph.
2. Confirm people render.
3. Confirm `PARENT_CHILD` edges render.
4. Confirm optional last name does not break node labels.
5. Confirm current zoom/pan/select behavior still works.

### Ownership

Use a second account or integration test evidence to verify another user cannot access the first user's tree.

---

## Regression Checks

The following current behavior should remain available:

- authenticated tree list
- tree create/open/delete
- person create/edit/delete
- relationship create/delete
- graph rendering
- logout
- ownership isolation

These are compatibility checks. They do not make current route names the final V1 API.

---

## Tests Explicitly Deferred

Do not block Phase 2 on complete coverage of:

- final `/people` routes
- final `/full` endpoint
- final API error codes/envelope
- share-link generation
- public read-only view
- max one spouse
- max two parents
- full pair conflict
- complete ancestor-cycle detection
- final spouse/co-parent visual alignment
- frontend tree search
- Playwright full suite

Document any existing failing tests unrelated to the Phase 2 schema work.

---

## Test Completion Criteria

Phase 2 testing is complete when:

- normalization unit tests pass
- partial-date unit tests pass
- Prisma reset/migration succeeds
- backend integration tests pass for new schema behavior
- auth regressions pass
- ownership isolation passes
- frontend builds
- graph/current editor smoke test passes
- manual browser checks are recorded accurately
- deferred relationship rules are documented rather than silently marked complete
