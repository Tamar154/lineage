# Phase 3 V1 API Contract Refactor Checklist

This checklist tracks the Phase 3 API contract refactor.

The goal is to replace the prototype private API surface with the V1 route, method, request, and response contracts without mixing in final error handling, advanced relationship rules, sharing, or frontend redesign.

Only check an item after it has been implemented and verified. Compilation is not runtime verification, and API tests are not browser verification.

---

## 1. Preparation

- [x] Read `docs/PRD.md`.
- [x] Read `docs/API.md`.
- [x] Read all files under `docs/phase-3-api/`.
- [x] Confirm Phase 1 Better Auth behavior is still working.
- [x] Confirm Phase 2 schema and naming decisions remain unchanged.
- [x] Confirm the project is still pre-production and legacy API aliases are unnecessary.
- [x] Do not start Phase 4 error-format work.
- [x] Do not start Phase 5 relationship-rule work.
- [x] Do not start Phase 7 UI/form redesign work.

---

## 2. Contract Decisions

- [x] Use `{ data: T }` for successful LineAge JSON responses.
- [x] Remove prototype `status: "success"` from successful responses.
- [x] Keep successful deletes as `204 No Content`.
- [x] Use the exact `TreeDto` field allowlist.
- [x] Use the exact `PersonDto` field allowlist.
- [x] Use the exact `RelationshipDto` field allowlist.
- [x] Use `{ tree, people, relationships }` inside the `/full` data payload.
- [x] Omit `shareLink` until Phase 9.
- [x] Use `relation: PARENT | CHILD | SPOUSE` for relationship creation input.
- [x] Keep stored relationship output as `PARENT_CHILD | SPOUSE`.

---

## 3. Shared Response DTO Boundary

- [x] Add one canonical `ApiSuccess<T>` type.
- [x] Add one canonical Tree DTO type and mapper/select.
- [x] Add one canonical Person DTO type and mapper/select.
- [x] Add one canonical Relationship DTO type and mapper/select.
- [x] Add the Full Tree DTO by composing the resource DTOs.
- [x] Do not return raw Prisma records from controllers.
- [x] Reuse resource DTOs across mutation and `/full` responses.
- [x] Serialize tree timestamps as ISO JSON strings.
- [x] Confirm DTO types do not import or expose complete Prisma model types as the external contract.

---

## 4. Tree Endpoints

- [x] Keep `GET /api/trees`.
- [x] Keep `POST /api/trees`.
- [x] Keep `GET /api/trees/:treeId`.
- [x] Keep `PATCH /api/trees/:treeId`.
- [x] Keep `DELETE /api/trees/:treeId`.
- [x] Return `TreeDto` from list, create, get, and update flows.
- [x] Exclude `ownerId` from all tree responses.
- [x] Exclude `normalizedName` from all tree responses.
- [x] Preserve owner-scoped list and mutation behavior.
- [x] Preserve existing tree validation and normalization behavior.

---

## 5. Full Tree Endpoint

- [x] Mount `GET /api/trees/:treeId/full`.
- [x] Remove `GET /api/trees/:treeId/graph`.
- [x] Rename graph-specific controller/type/service names where they no longer describe the contract.
- [x] Return `{ data: { tree, people, relationships } }`.
- [x] Return an empty `people` array for an empty tree.
- [x] Return an empty `relationships` array when none exist.
- [x] Use exact Tree, Person, and Relationship DTOs.
- [x] Use `people`, not `persons`, in the external response.
- [x] Do not return React Flow nodes, edges, or layout positions.
- [x] Do not add share-link status yet.
- [x] Preserve authenticated owner-only access.

---

## 6. People Routes

- [x] Mount people routes at `/api/trees/:treeId/people`.
- [x] Remove the `/api/trees/:treeId/persons` mount.
- [x] Keep `POST /api/trees/:treeId/people`.
- [x] Change update to `PATCH /api/trees/:treeId/people/:personId`.
- [x] Keep `DELETE /api/trees/:treeId/people/:personId`.
- [x] Rename route parameter `id` to `personId` in routes, validators, types, and controllers.
- [x] Remove `GET /api/trees/:treeId/people`.
- [x] Remove `GET /api/trees/:treeId/people/:personId`.
- [x] Remove person list/by-ID controller code and unused types/imports.
- [x] Return `PersonDto` from create and update.
- [x] Preserve partial-update semantics.
- [x] Preserve existing person validation and cascade behavior.

---

## 7. Relationship Routes and Input Contract

- [x] Keep `POST /api/trees/:treeId/relationships`.
- [x] Keep `DELETE /api/trees/:treeId/relationships/:relationshipId`.
- [x] Rename route parameter `id` to `relationshipId` in routes, validators, types, and controllers.
- [x] Remove relationship list route/controller.
- [x] Remove relationship by-ID route/controller.
- [x] Remove relationship update route/controller.
- [x] Remove unused relationship update validation and service parameters if no longer needed.
- [x] Validate `relation` as `PARENT | CHILD | SPOUSE`.
- [x] Reject client input field `type`.
- [x] Convert `PARENT` without swapping A/B.
- [x] Convert `CHILD` by swapping A/B.
- [x] Convert `SPOUSE` to stored `SPOUSE` and retain stable normalization.
- [x] Do not sort parent-child IDs.
- [x] Return the canonical stored `RelationshipDto`.
- [x] Preserve existing compatible relationship validation.
- [x] Do not add advanced Phase 5 rules.

---

## 8. Removed Surface

- [x] Do not keep `/persons` compatibility aliases.
- [x] Do not keep `/graph` compatibility aliases.
- [x] Do not keep person GET endpoints.
- [x] Do not keep person `PUT` update.
- [x] Do not keep relationship GET endpoints.
- [x] Do not keep relationship PUT/PATCH endpoints.
- [x] Confirm retired routes reach only the normal 404 handler.

---

## 9. Ownership and Security

- [x] Every private route still uses Better Auth `requireAuth`.
- [x] Every tree-scoped route validates `treeId` against authenticated `ownerId`.
- [x] Person mutations scope `personId` to the validated route tree.
- [x] Relationship deletion scopes `relationshipId` to the validated route tree.
- [x] Relationship participants are validated against the route tree.
- [x] No request may override `ownerId`, `normalizedName`, or `treeId`.
- [x] No response exposes `ownerId` or `normalizedName`.
- [x] No nested DTO exposes `treeId` or Prisma relation objects.
- [x] No response exposes Better Auth Account, Session, Verification, token, secret, or OAuth fields.
- [x] Strict request validators reject unknown fields.
- [x] Cross-tree and cross-owner regression tests pass.

---

## 10. Frontend Compatibility

- [x] Update person service paths from `/persons` to `/people`.
- [x] Update person service to use `PATCH`.
- [x] Remove unused person list/by-ID client methods.
- [x] Replace graph service usage with a full-tree service/contract.
- [x] Update editor data loading to use `/full`.
- [x] Update aggregate property usage from `persons` to `people`.
- [x] Update frontend success-response types to `{ data: ... }`.
- [x] Remove assumptions about `status: "success"`.
- [x] Send `relation` from relationship creation.
- [x] Preserve correct parent/child input direction.
- [x] Keep current React Flow layout and UI design unchanged.
- [x] Confirm there are no runtime `/persons` or `/graph` references.
- [x] Confirm frontend TypeScript/Vite build passes.

---

## 11. Unit Tests

- [x] Test Tree DTO exact keys.
- [x] Test Person DTO exact keys.
- [x] Test Relationship DTO exact keys.
- [x] Test PARENT input conversion.
- [x] Test CHILD input conversion.
- [x] Test SPOUSE input conversion.
- [x] Test that parent-child conversion never sorts IDs.

---

## 12. Integration Tests

- [x] Test the complete Phase 3 endpoint matrix.
- [x] Test retired routes are unavailable.
- [x] Test exact success envelope and absence of `status`.
- [x] Test tree list/create/get/update DTOs.
- [x] Test empty `/full` response.
- [x] Test populated `/full` response.
- [x] Test `people` key replaces `persons`.
- [x] Test person create response DTO.
- [x] Test person PATCH and omitted-field behavior.
- [x] Test person deletion through `/people`.
- [x] Test PARENT request and stored direction.
- [x] Test CHILD request and swapped stored direction.
- [x] Test SPOUSE request and canonical output.
- [x] Test relationship request rejects `type` and unknown fields.
- [x] Test relationship delete response and behavior.
- [x] Test all successful deletes return empty `204` responses.
- [x] Add recursive forbidden-field leak coverage.

---

## 13. Auth and Ownership Regression

- [x] Unauthenticated tree routes return `401`.
- [x] Unauthenticated people routes return `401`.
- [x] Unauthenticated relationship routes return `401`.
- [x] User A lists only User A trees.
- [x] User B cannot get or update User A tree.
- [x] User B cannot load User A full tree.
- [x] User B cannot create, update, or delete User A person.
- [x] User B cannot create or delete User A relationship.
- [x] Cross-tree participant IDs are rejected.
- [x] Cross-tree relationship IDs cannot be deleted through another tree.
- [x] Better Auth regression tests still pass.

---

## 14. Error-Phase Boundary

- [x] Preserve meaningful current HTTP statuses.
- [x] Keep the current error body style for Phase 3.
- [x] Do not add the final `{ error: { code, message, details } }` envelope.
- [x] Do not add the final error-code catalog.
- [x] Do not decide global `403` versus `404` behavior in this phase.
- [x] Keep Phase 3 tests independent of future error bodies.

---

## 15. README

- [x] Update README from `persons` to `people`.
- [x] Update README person method from `PUT` to `PATCH`.
- [x] Remove excluded person GET endpoints from README.
- [x] Remove relationship GET/update endpoints from README.
- [x] Update relationship request example to use `relation`.
- [x] Replace graph documentation with `/full`.
- [x] Document the successful response envelope and DTO shape accurately.
- [x] Do not document Phase 4, Phase 5, or Phase 9 work as implemented.

---

## 16. Validation

- [x] Backend TypeScript build passes.
- [x] Backend Phase 3 tests pass.
- [x] Existing auth tests pass.
- [x] Existing compatible schema/domain tests pass after contract rewrites.
- [x] Frontend TypeScript/Vite build passes.
- [x] Record lint status separately from build/test status.
- [x] Distinguish pre-existing lint failures from Phase 3 regressions.
- [x] Record independently verified commands and results.

### Verification record (2026-08-19)

- `cd backend && npm run build` — passed.
- `cd backend && npm test` — passed 6 files / 62 tests, serially, against the configured PostgreSQL test database.
- `cd frontend && npx tsc -b` — passed.
- `cd frontend && npm run build` — passed; Vite reported only its large-chunk warning.
- `cd backend && npm run lint` — failed with 142 errors and 1 warning. Existing project findings remain in database/auth/error-handler code and Supertest tests; Phase 3's new Supertest contract test also follows the same untyped-response pattern and contributes lint findings. This is recorded separately and is not represented as a passing check.
- `cd frontend && npm run lint` — failed with 4 errors and 1 warning in pre-existing `CreateTreeForm.tsx` and `TreesPage.tsx`; no Phase 3-touched frontend file was reported.
- Runtime legacy-reference scan found `/persons` and `/graph` only in negative retired-route tests.
- Browser/manual verification was not performed; the manual checklist remains unchecked.

---

## 17. Manual Verification

Backend/API:

- [x] Start the backend with the isolated development/test setup.
- [x] Verify each retained endpoint responds with the documented method.
- [x] Verify retired endpoints are unavailable.
- [x] Verify response bodies contain only allowlisted fields.
- [x] Verify `/full` works for empty and populated trees.

Frontend/browser:

- [x] Register or log in.
- [x] Tree dashboard loads.
- [x] Empty tree opens through `/full`.
- [x] Person create works through `/people`.
- [x] Person edit works through `PATCH`.
- [x] Relationship creation works through `relation` input.
- [x] Current visual tree renders and refreshes.
- [x] Person and relationship deletion still work.
- [x] Logout still blocks private access.

Do not check browser items based solely on API tests or builds.

---

## 18. Phase Completion Gate

- [x] Only the intended Phase 3 private endpoints are mounted.
- [x] All successful JSON responses use explicit DTOs.
- [x] Internal tree fields are no longer exposed.
- [x] Nested persistence fields are no longer exposed.
- [x] `/people`, `PATCH`, and `/full` are implemented.
- [x] Excluded person and relationship endpoints are removed.
- [x] Relationship request conversion is implemented and tested.
- [x] Better Auth and ownership isolation remain intact.
- [x] Backend and frontend build successfully.
- [x] Required automated tests pass.
- [x] Manual verification is recorded accurately.
- [x] README matches the implemented API.
- [x] No Phase 4 error overhaul was added.
- [x] No Phase 5 relationship-rule overhaul was added.
- [x] No sharing or UI redesign work was added.
