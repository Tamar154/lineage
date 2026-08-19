# Phase 3 V1 API Contract Refactor Checklist

This checklist tracks the Phase 3 API contract refactor.

The goal is to replace the prototype private API surface with the V1 route, method, request, and response contracts without mixing in final error handling, advanced relationship rules, sharing, or frontend redesign.

Only check an item after it has been implemented and verified. Compilation is not runtime verification, and API tests are not browser verification.

---

## 1. Preparation

- [ ] Read `docs/PRD.md`.
- [ ] Read `docs/API.md`.
- [ ] Read all files under `docs/phase-3-api/`.
- [ ] Confirm Phase 1 Better Auth behavior is still working.
- [ ] Confirm Phase 2 schema and naming decisions remain unchanged.
- [ ] Confirm the project is still pre-production and legacy API aliases are unnecessary.
- [ ] Do not start Phase 4 error-format work.
- [ ] Do not start Phase 5 relationship-rule work.
- [ ] Do not start Phase 7 UI/form redesign work.

---

## 2. Contract Decisions

- [ ] Use `{ data: T }` for successful LineAge JSON responses.
- [ ] Remove prototype `status: "success"` from successful responses.
- [ ] Keep successful deletes as `204 No Content`.
- [ ] Use the exact `TreeDto` field allowlist.
- [ ] Use the exact `PersonDto` field allowlist.
- [ ] Use the exact `RelationshipDto` field allowlist.
- [ ] Use `{ tree, people, relationships }` inside the `/full` data payload.
- [ ] Omit `shareLink` until Phase 9.
- [ ] Use `relation: PARENT | CHILD | SPOUSE` for relationship creation input.
- [ ] Keep stored relationship output as `PARENT_CHILD | SPOUSE`.

---

## 3. Shared Response DTO Boundary

- [ ] Add one canonical `ApiSuccess<T>` type.
- [ ] Add one canonical Tree DTO type and mapper/select.
- [ ] Add one canonical Person DTO type and mapper/select.
- [ ] Add one canonical Relationship DTO type and mapper/select.
- [ ] Add the Full Tree DTO by composing the resource DTOs.
- [ ] Do not return raw Prisma records from controllers.
- [ ] Reuse resource DTOs across mutation and `/full` responses.
- [ ] Serialize tree timestamps as ISO JSON strings.
- [ ] Confirm DTO types do not import or expose complete Prisma model types as the external contract.

---

## 4. Tree Endpoints

- [ ] Keep `GET /api/trees`.
- [ ] Keep `POST /api/trees`.
- [ ] Keep `GET /api/trees/:treeId`.
- [ ] Keep `PATCH /api/trees/:treeId`.
- [ ] Keep `DELETE /api/trees/:treeId`.
- [ ] Return `TreeDto` from list, create, get, and update flows.
- [ ] Exclude `ownerId` from all tree responses.
- [ ] Exclude `normalizedName` from all tree responses.
- [ ] Preserve owner-scoped list and mutation behavior.
- [ ] Preserve existing tree validation and normalization behavior.

---

## 5. Full Tree Endpoint

- [ ] Mount `GET /api/trees/:treeId/full`.
- [ ] Remove `GET /api/trees/:treeId/graph`.
- [ ] Rename graph-specific controller/type/service names where they no longer describe the contract.
- [ ] Return `{ data: { tree, people, relationships } }`.
- [ ] Return an empty `people` array for an empty tree.
- [ ] Return an empty `relationships` array when none exist.
- [ ] Use exact Tree, Person, and Relationship DTOs.
- [ ] Use `people`, not `persons`, in the external response.
- [ ] Do not return React Flow nodes, edges, or layout positions.
- [ ] Do not add share-link status yet.
- [ ] Preserve authenticated owner-only access.

---

## 6. People Routes

- [ ] Mount people routes at `/api/trees/:treeId/people`.
- [ ] Remove the `/api/trees/:treeId/persons` mount.
- [ ] Keep `POST /api/trees/:treeId/people`.
- [ ] Change update to `PATCH /api/trees/:treeId/people/:personId`.
- [ ] Keep `DELETE /api/trees/:treeId/people/:personId`.
- [ ] Rename route parameter `id` to `personId` in routes, validators, types, and controllers.
- [ ] Remove `GET /api/trees/:treeId/people`.
- [ ] Remove `GET /api/trees/:treeId/people/:personId`.
- [ ] Remove person list/by-ID controller code and unused types/imports.
- [ ] Return `PersonDto` from create and update.
- [ ] Preserve partial-update semantics.
- [ ] Preserve existing person validation and cascade behavior.

---

## 7. Relationship Routes and Input Contract

- [ ] Keep `POST /api/trees/:treeId/relationships`.
- [ ] Keep `DELETE /api/trees/:treeId/relationships/:relationshipId`.
- [ ] Rename route parameter `id` to `relationshipId` in routes, validators, types, and controllers.
- [ ] Remove relationship list route/controller.
- [ ] Remove relationship by-ID route/controller.
- [ ] Remove relationship update route/controller.
- [ ] Remove unused relationship update validation and service parameters if no longer needed.
- [ ] Validate `relation` as `PARENT | CHILD | SPOUSE`.
- [ ] Reject client input field `type`.
- [ ] Convert `PARENT` without swapping A/B.
- [ ] Convert `CHILD` by swapping A/B.
- [ ] Convert `SPOUSE` to stored `SPOUSE` and retain stable normalization.
- [ ] Do not sort parent-child IDs.
- [ ] Return the canonical stored `RelationshipDto`.
- [ ] Preserve existing compatible relationship validation.
- [ ] Do not add advanced Phase 5 rules.

---

## 8. Removed Surface

- [ ] Do not keep `/persons` compatibility aliases.
- [ ] Do not keep `/graph` compatibility aliases.
- [ ] Do not keep person GET endpoints.
- [ ] Do not keep person `PUT` update.
- [ ] Do not keep relationship GET endpoints.
- [ ] Do not keep relationship PUT/PATCH endpoints.
- [ ] Confirm retired routes reach only the normal 404 handler.

---

## 9. Ownership and Security

- [ ] Every private route still uses Better Auth `requireAuth`.
- [ ] Every tree-scoped route validates `treeId` against authenticated `ownerId`.
- [ ] Person mutations scope `personId` to the validated route tree.
- [ ] Relationship deletion scopes `relationshipId` to the validated route tree.
- [ ] Relationship participants are validated against the route tree.
- [ ] No request may override `ownerId`, `normalizedName`, or `treeId`.
- [ ] No response exposes `ownerId` or `normalizedName`.
- [ ] No nested DTO exposes `treeId` or Prisma relation objects.
- [ ] No response exposes Better Auth Account, Session, Verification, token, secret, or OAuth fields.
- [ ] Strict request validators reject unknown fields.
- [ ] Cross-tree and cross-owner regression tests pass.

---

## 10. Frontend Compatibility

- [ ] Update person service paths from `/persons` to `/people`.
- [ ] Update person service to use `PATCH`.
- [ ] Remove unused person list/by-ID client methods.
- [ ] Replace graph service usage with a full-tree service/contract.
- [ ] Update editor data loading to use `/full`.
- [ ] Update aggregate property usage from `persons` to `people`.
- [ ] Update frontend success-response types to `{ data: ... }`.
- [ ] Remove assumptions about `status: "success"`.
- [ ] Send `relation` from relationship creation.
- [ ] Preserve correct parent/child input direction.
- [ ] Keep current React Flow layout and UI design unchanged.
- [ ] Confirm there are no runtime `/persons` or `/graph` references.
- [ ] Confirm frontend TypeScript/Vite build passes.

---

## 11. Unit Tests

- [ ] Test Tree DTO exact keys.
- [ ] Test Person DTO exact keys.
- [ ] Test Relationship DTO exact keys.
- [ ] Test PARENT input conversion.
- [ ] Test CHILD input conversion.
- [ ] Test SPOUSE input conversion.
- [ ] Test that parent-child conversion never sorts IDs.

---

## 12. Integration Tests

- [ ] Test the complete Phase 3 endpoint matrix.
- [ ] Test retired routes are unavailable.
- [ ] Test exact success envelope and absence of `status`.
- [ ] Test tree list/create/get/update DTOs.
- [ ] Test empty `/full` response.
- [ ] Test populated `/full` response.
- [ ] Test `people` key replaces `persons`.
- [ ] Test person create response DTO.
- [ ] Test person PATCH and omitted-field behavior.
- [ ] Test person deletion through `/people`.
- [ ] Test PARENT request and stored direction.
- [ ] Test CHILD request and swapped stored direction.
- [ ] Test SPOUSE request and canonical output.
- [ ] Test relationship request rejects `type` and unknown fields.
- [ ] Test relationship delete response and behavior.
- [ ] Test all successful deletes return empty `204` responses.
- [ ] Add recursive forbidden-field leak coverage.

---

## 13. Auth and Ownership Regression

- [ ] Unauthenticated tree routes return `401`.
- [ ] Unauthenticated people routes return `401`.
- [ ] Unauthenticated relationship routes return `401`.
- [ ] User A lists only User A trees.
- [ ] User B cannot get or update User A tree.
- [ ] User B cannot load User A full tree.
- [ ] User B cannot create, update, or delete User A person.
- [ ] User B cannot create or delete User A relationship.
- [ ] Cross-tree participant IDs are rejected.
- [ ] Cross-tree relationship IDs cannot be deleted through another tree.
- [ ] Better Auth regression tests still pass.

---

## 14. Error-Phase Boundary

- [ ] Preserve meaningful current HTTP statuses.
- [ ] Keep the current error body style for Phase 3.
- [ ] Do not add the final `{ error: { code, message, details } }` envelope.
- [ ] Do not add the final error-code catalog.
- [ ] Do not decide global `403` versus `404` behavior in this phase.
- [ ] Keep Phase 3 tests independent of future error bodies.

---

## 15. README

- [ ] Update README from `persons` to `people`.
- [ ] Update README person method from `PUT` to `PATCH`.
- [ ] Remove excluded person GET endpoints from README.
- [ ] Remove relationship GET/update endpoints from README.
- [ ] Update relationship request example to use `relation`.
- [ ] Replace graph documentation with `/full`.
- [ ] Document the successful response envelope and DTO shape accurately.
- [ ] Do not document Phase 4, Phase 5, or Phase 9 work as implemented.

---

## 16. Validation

- [ ] Backend TypeScript build passes.
- [ ] Backend Phase 3 tests pass.
- [ ] Existing auth tests pass.
- [ ] Existing compatible schema/domain tests pass after contract rewrites.
- [ ] Frontend TypeScript/Vite build passes.
- [ ] Record lint status separately from build/test status.
- [ ] Distinguish pre-existing lint failures from Phase 3 regressions.
- [ ] Record independently verified commands and results.

---

## 17. Manual Verification

Backend/API:

- [ ] Start the backend with the isolated development/test setup.
- [ ] Verify each retained endpoint responds with the documented method.
- [ ] Verify retired endpoints are unavailable.
- [ ] Verify response bodies contain only allowlisted fields.
- [ ] Verify `/full` works for empty and populated trees.

Frontend/browser:

- [ ] Register or log in.
- [ ] Tree dashboard loads.
- [ ] Empty tree opens through `/full`.
- [ ] Person create works through `/people`.
- [ ] Person edit works through `PATCH`.
- [ ] Relationship creation works through `relation` input.
- [ ] Current visual tree renders and refreshes.
- [ ] Person and relationship deletion still work.
- [ ] Logout still blocks private access.

Do not check browser items based solely on API tests or builds.

---

## 18. Phase Completion Gate

- [ ] Only the intended Phase 3 private endpoints are mounted.
- [ ] All successful JSON responses use explicit DTOs.
- [ ] Internal tree fields are no longer exposed.
- [ ] Nested persistence fields are no longer exposed.
- [ ] `/people`, `PATCH`, and `/full` are implemented.
- [ ] Excluded person and relationship endpoints are removed.
- [ ] Relationship request conversion is implemented and tested.
- [ ] Better Auth and ownership isolation remain intact.
- [ ] Backend and frontend build successfully.
- [ ] Required automated tests pass.
- [ ] Manual verification is recorded accurately.
- [ ] README matches the implemented API.
- [ ] No Phase 4 error overhaul was added.
- [ ] No Phase 5 relationship-rule overhaul was added.
- [ ] No sharing or UI redesign work was added.

