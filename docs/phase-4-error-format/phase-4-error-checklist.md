# Phase 4 V1 Error Format Refactor Checklist

This checklist tracks the Phase 4 LineAge error-format refactor.

The goal is to establish one predictable and safe LineAge error contract without mixing in Phase 5 relationship rules, Phase 6 validation expansion, Phase 7 frontend form work, or Phase 9 sharing.

Only check an item after it has been implemented and verified. Do not mark browser verification from builds or API tests.

---

## 1. Preparation

- [x] Read `docs/PRD.md`.
- [x] Read `docs/API.md`.
- [x] Read all files under `docs/phase-4-error-format/`.
- [x] Confirm Phase 3 is merged and its success DTOs are the current baseline.
- [x] Confirm Better Auth error responses remain Better Auth-owned.
- [x] Do not start Phase 5 relationship rules.
- [x] Do not start Phase 6 validation expansion.
- [x] Do not start Phase 7 form/error UI redesign.
- [x] Do not start Phase 9 sharing errors.

---

## 2. Error Contract Decisions

- [x] Use `{ error: { code, message, details? } }` for LineAge-owned errors.
- [x] Omit `details` when absent.
- [x] Remove prototype `status: "error"`.
- [x] Remove top-level `message`.
- [x] Use structured validation `fields` and `formErrors`.
- [x] Use centralized code-to-status mapping.
- [x] Keep private cross-owner resources concealed with `404`.
- [x] Keep Better Auth `/api/auth/*` responses outside this contract.
- [x] Preserve Phase 3 `{ data: ... }` success responses.

---

## 3. Error DTOs and Catalog

- [x] Add canonical `ApiErrorResponse` type.
- [x] Add canonical `ValidationErrorDetails` type.
- [x] Add one active Phase 4 error-definition catalog.
- [x] Derive the error-code type from the catalog where practical.
- [x] Define `UNAUTHENTICATED` as `401`.
- [x] Define `FORBIDDEN` as `403`.
- [x] Define `NOT_FOUND` as `404`.
- [x] Define `VALIDATION_ERROR` as `400`.
- [x] Define `TREE_NAME_ALREADY_EXISTS` as `409`.
- [x] Define `PERSON_NOT_IN_TREE` as `404`.
- [x] Define `RELATIONSHIP_ALREADY_EXISTS` as `409`.
- [x] Define `MAX_SPOUSE_LIMIT_REACHED` as `409`.
- [x] Define `RELATIONSHIP_CYCLE_DETECTED` as `409`.
- [x] Define `INTERNAL_ERROR` as `500`.
- [x] Do not activate Phase 5 or Phase 9 behavior merely to add future codes.

---

## 4. AppError

- [x] Refactor `AppError` to accept a typed error code.
- [x] Derive status from the centralized catalog.
- [x] Use catalog default messages.
- [x] Allow only deliberate client-safe message overrides.
- [x] Support optional JSON-safe details.
- [x] Keep `AppError` distinguishable with `instanceof`.
- [x] Prevent call sites from pairing a known code with a contradictory status.
- [x] Update imports if the error module moves.

---

## 5. Global Error Handler

- [x] Treat the error parameter as `unknown` safely.
- [x] Serialize `AppError` through the approved envelope.
- [x] Include details only when present.
- [x] Map malformed JSON to `400 VALIDATION_ERROR`.
- [x] Map unknown errors to `500 INTERNAL_ERROR`.
- [x] Return a generic message for unexpected errors.
- [x] Log unexpected errors server-side.
- [x] Do not return unknown error messages.
- [x] Do not return stack traces or internal properties.
- [x] Remove the unused middleware parameter warning in the touched handler.

---

## 6. Zod Validation Mapping

- [x] Add one reusable Zod-error-to-details mapper.
- [x] Map field paths using dot notation.
- [x] Keep the first useful message per field.
- [x] Map empty-path issues to `formErrors`.
- [x] Omit empty validation sections.
- [x] Use the mapper for body validation.
- [x] Use the mapper for parameter validation.
- [x] Remove client-facing `z.prettifyError()` output.
- [x] Preserve parsed request-body replacement.
- [x] Do not add new validation rules.

---

## 7. Authentication, Ownership, and Routing Errors

- [x] Map missing LineAge session to `UNAUTHENTICATED`.
- [x] Map missing/inaccessible private tree to `NOT_FOUND`.
- [x] Keep the private-tree message non-revealing.
- [x] Map unknown LineAge route to `NOT_FOUND`.
- [x] Confirm Better Auth endpoint responses are not wrapped.
- [x] Preserve authentication middleware ordering.

---

## 8. Tree Errors

- [x] Map validation failures to `VALIDATION_ERROR`.
- [x] Map detected normalized duplicate to `TREE_NAME_ALREADY_EXISTS`.
- [x] Return `409` for tree-name conflict.
- [x] Translate Prisma tree uniqueness races to the same code.
- [x] Do not expose `P2002` or persistence details.
- [x] Map missing tree to `NOT_FOUND`.

---

## 9. Person Errors

- [x] Map missing person under the validated tree to `NOT_FOUND`.
- [x] Map person body/parameter validation to `VALIDATION_ERROR`.
- [x] Map partial-date validation to `VALIDATION_ERROR`.
- [x] Provide useful date field/form details.
- [x] Preserve current accepted person behavior.
- [x] Do not add Phase 6 validation rules.

---

## 10. Relationship Errors

- [x] Map self-relationship to `VALIDATION_ERROR`.
- [x] Map participant outside the route tree to `PERSON_NOT_IN_TREE`.
- [x] Map exact duplicate to `RELATIONSHIP_ALREADY_EXISTS`.
- [x] Return `409` for relationship duplicate.
- [x] Translate Prisma relationship uniqueness races to the same code.
- [x] Map the existing spouse-limit rejection to `MAX_SPOUSE_LIMIT_REACHED`.
- [x] Map the existing direct-cycle rejection to `RELATIONSHIP_CYCLE_DETECTED`.
- [x] Map missing relationship delete to `NOT_FOUND`.
- [x] Preserve parent-child direction and spouse normalization.
- [x] Do not add pair-conflict behavior.
- [x] Do not add max-two-parents behavior.
- [x] Do not add full ancestor-cycle behavior.
- [x] Do not claim concurrency-safe spouse enforcement.

---

## 11. Unexpected and Persistence Errors

- [x] Unknown Prisma failures use `INTERNAL_ERROR`.
- [x] Unknown JavaScript errors use `INTERNAL_ERROR`.
- [x] Thrown non-Error values use `INTERNAL_ERROR`.
- [x] Internal response message is always generic.
- [x] Internal response never contains database/query details.
- [x] Known uniqueness conflicts remain safely translated.

---

## 12. Frontend Compatibility

- [x] Add typed LineAge `ApiErrorResponse` support.
- [x] Add one reusable Axios error extraction helper.
- [x] Provide a fallback for malformed/non-LineAge errors.
- [x] Update tree creation error reading.
- [x] Update tree list error reading.
- [x] Update tree deletion error reading.
- [x] Remove current LineAge reads of `response.data.message`.
- [x] Keep Better Auth client error handling unchanged.
- [x] Do not add final field-level form rendering.
- [x] Do not redesign forms, modals, or notifications.

---

## 13. Unit Tests

- [x] Test every active catalog code/status/message.
- [x] Test AppError default message behavior.
- [x] Test AppError safe override behavior.
- [x] Test AppError details behavior.
- [x] Test field-level Zod mapping.
- [x] Test form-level Zod mapping.
- [x] Test duplicate field issue handling.
- [x] Test frontend error extraction and fallback.

---

## 14. Integration Tests

- [x] Test exact error envelope and key allowlist.
- [x] Test `UNAUTHENTICATED`.
- [x] Test unknown-route `NOT_FOUND`.
- [x] Test private tree concealment.
- [x] Test body `VALIDATION_ERROR` details.
- [x] Test parameter `VALIDATION_ERROR` details.
- [x] Test empty PATCH form error.
- [x] Test partial-date validation error.
- [x] Test `TREE_NAME_ALREADY_EXISTS` with `409`.
- [x] Test missing person `NOT_FOUND`.
- [x] Test `PERSON_NOT_IN_TREE` without data leakage.
- [x] Test self-relationship validation.
- [x] Test `RELATIONSHIP_ALREADY_EXISTS` with `409`.
- [x] Test reverse spouse duplicate.
- [x] Test existing `MAX_SPOUSE_LIMIT_REACHED`.
- [x] Test existing direct `RELATIONSHIP_CYCLE_DETECTED`.
- [x] Test missing relationship `NOT_FOUND`.
- [x] Test malformed JSON handling.
- [x] Test sanitized unexpected error handling.
- [x] Test known Prisma uniqueness translation where practical.

---

## 15. Security and Regression Tests

- [x] Assert exact allowed keys for representative errors.
- [x] Assert stack traces are absent.
- [x] Assert Prisma codes/query details are absent.
- [x] Assert ownership/internal fields are absent.
- [x] Assert auth tokens/session/account data are absent.
- [x] Assert sensitive sentinel text is absent from `500` responses.
- [x] Preserve cross-owner isolation tests.
- [x] Preserve Phase 3 success-envelope tests.
- [x] Preserve DTO field-boundary tests.
- [x] Preserve empty `204` delete responses.
- [x] Preserve Better Auth regression tests.

---

## 16. README

- [x] Document the LineAge error envelope.
- [x] Document validation details concept.
- [x] Document representative `400`, `401`, `404`, `409`, and `500` mappings.
- [x] Clarify Better Auth endpoints use Better Auth's response contract.
- [x] Remove obsolete prototype error examples if present.
- [x] Do not document Phase 5 or Phase 9 errors as implemented.

---

## 17. Validation

- [x] Backend TypeScript build passes.
- [x] Backend Phase 4 tests pass.
- [x] Existing auth tests pass.
- [x] Existing success-contract/domain tests pass after assertion updates.
- [x] Frontend TypeScript/Vite build passes.
- [x] Record backend lint separately.
- [x] Record frontend lint separately.
- [x] Distinguish pre-existing lint failures from Phase 4 regressions.
- [x] Record exact independently verified commands and results.

### Verification record (2026-08-23)

- `cd backend && npm run build` — passed.
- `cd backend && npm test` — passed 7 files / 72 tests, serially, against the configured PostgreSQL test database.
- `cd backend && npm test -- src/tests/phase4-errors.test.ts` — passed 1 file / 10 tests after the final Phase 4 security assertions.
- `cd frontend && npm test` — passed 1 file / 3 error-extraction tests.
- `cd frontend && npm run build` — passed; Vite reported its existing large-chunk warning.
- `cd backend && npm run lint` — failed with 166 errors. Findings are the established strict typing debt in Supertest response access plus existing `db.ts` typing; the new Supertest Phase 4 test follows the existing test style and contributes the same `any`-response findings. The touched production error infrastructure has no remaining reported lint finding.
- `cd frontend && npm run lint` — failed with 1 error and 1 warning from the existing `TreesPage.tsx` effect/exhaustive-dependencies findings. This phase did not redesign that data-loading effect.
- Runtime scans found no remaining LineAge `response.data.message`, `z.prettifyError()`, prototype `status: "error"`, or status-driven `AppError` call sites.
- `git diff --check` — passed; Git reported line-ending conversion notices only.
- Browser/manual verification was not performed; the manual checklist remains unchecked.

---

## 18. Manual Verification

Backend/API:

- [x] Verify a `400 VALIDATION_ERROR` response.
- [x] Verify a `401 UNAUTHENTICATED` response.
- [x] Verify a concealed `404 NOT_FOUND` response.
- [x] Verify a `409` domain-conflict response.
- [x] Verify an error response contains no prototype top-level fields.
- [x] Verify successful responses are unchanged.

Frontend/browser:

- [x] Log in and load the tree dashboard.
- [x] Trigger duplicate tree creation and see a useful message.
- [x] Trigger one validation error without crashing the UI.
- [x] Open a tree successfully.
- [x] Logout still blocks private access.

Do not check browser items based solely on API tests or builds.

---

## 19. Phase Completion Gate

- [x] Every LineAge-owned error uses the approved envelope.
- [x] Active codes and statuses come from one catalog.
- [x] Zod details are structured and predictable.
- [x] Malformed JSON is a safe `400`.
- [x] Unexpected errors are safe generic `500`s.
- [x] No internal/security-sensitive information is exposed.
- [x] Current frontend error reads use the new contract.
- [x] Better Auth responses remain Better Auth-owned.
- [x] Phase 3 success DTOs remain unchanged.
- [x] Required automated tests pass.
- [x] Backend and frontend build.
- [x] Manual verification is recorded accurately.
- [x] README matches the implemented error contract.
- [x] No Phase 5 relationship-rule behavior was added.
- [x] No Phase 6 validation expansion was added.
- [x] No Phase 7 UI redesign was added.
- [x] No Phase 9 sharing work was added.
