# Phase 4: V1 Error Format Refactor

## Purpose

This document defines Phase 4 of the LineAge refactor.

Phase 1 established Better Auth. Phase 2 established the V1 domain schema. Phase 3 established the private V1 API surface and explicit success DTOs. Phase 4 now gives LineAge domain endpoints one predictable, safe error contract before later frontend form work depends on it.

The V1 PRD, API specification, and this phase plan define the target. The current implementation is evidence of existing behavior, not the final error contract.

No unrelated domain, relationship-rule, sharing, or UI feature should be included in this phase.

---

## Phase Goal

All errors produced by LineAge-owned domain routes must use:

```ts
type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

After this phase:

- callers can depend on a stable error envelope
- each handled application error has a stable machine-readable code
- status codes come from one centralized definition
- Zod failures expose structured, frontend-usable validation details
- unexpected failures return a generic `500` response without leaking internals
- current frontend error reads understand the new envelope
- Better Auth continues to own its own endpoint responses

---

## Boundary: LineAge Errors vs Better Auth Errors

This phase applies to LineAge-owned routes and middleware:

```txt
/api/trees
/api/trees/:treeId
/api/trees/:treeId/full
/api/trees/:treeId/people
/api/trees/:treeId/relationships
the LineAge requireAuth middleware protecting those routes
the LineAge 404 handler
```

Better Auth owns:

```txt
/api/auth/*
```

Do not wrap, translate, or redefine Better Auth's signup, signin, OAuth, signout, or session error responses. The frontend auth client continues to use Better Auth's contract.

---

## Confirmed Error Envelope

### Error with no details

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Person not found."
  }
}
```

When no details exist, omit `details`. Do not return `details: null`.

### Validation error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "details": {
      "fields": {
        "firstName": "First name is required."
      }
    }
  }
}
```

### Form-level validation error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "details": {
      "formErrors": [
        "At least one field is required."
      ]
    }
  }
}
```

Validation details use:

```ts
type ValidationErrorDetails = {
  fields?: Record<string, string>;
  formErrors?: string[];
};
```

Rules:

- field paths use dot notation for nested values
- store the first useful message for each field
- issues with no field path become `formErrors`
- omit empty `fields` and `formErrors`
- never return raw Zod issue objects or `z.prettifyError()` output

---

## Phase 4 Error Catalog

The active Phase 4 catalog is:

| Code | HTTP status | Default public message | Current use |
| --- | ---: | --- | --- |
| `UNAUTHENTICATED` | `401` | You must be signed in to continue. | Missing LineAge session |
| `FORBIDDEN` | `403` | You do not have permission to perform this action. | Available for explicit authorization failures; private-tree concealment may still use `404` |
| `NOT_FOUND` | `404` | The requested resource was not found. | Missing route, tree, person, or relationship |
| `VALIDATION_ERROR` | `400` | Some fields are invalid. | Zod, malformed JSON, self-relationship, partial-date input |
| `TREE_NAME_ALREADY_EXISTS` | `409` | You already have a tree with this name. | Per-owner normalized tree-name conflict |
| `PERSON_NOT_IN_TREE` | `404` | One or more people were not found in this tree. | Relationship participant outside the validated tree |
| `RELATIONSHIP_ALREADY_EXISTS` | `409` | This relationship already exists. | Duplicate relationship |
| `MAX_SPOUSE_LIMIT_REACHED` | `409` | A person cannot have more than one spouse. | Existing compatible spouse-limit check |
| `RELATIONSHIP_CYCLE_DETECTED` | `409` | This relationship would create a cycle. | Existing direct-cycle check |
| `INTERNAL_ERROR` | `500` | An unexpected error occurred. | Unhandled failure |

Status policy for this phase:

```txt
400 → invalid request shape or value
401 → no authenticated LineAge session
403 → authenticated but explicitly forbidden
404 → missing or intentionally concealed resource
409 → domain-state conflict
500 → unexpected internal failure
```

Private tree ownership continues to return `404`, not `403`, to avoid confirming whether another user's tree exists. This resolves current private-tree behavior only; it does not establish a global policy for future sharing features.

---

## Codes Reserved for Later Phases

The V1 API specification names additional codes, but Phase 4 must not pretend their behavior exists:

```txt
RELATIONSHIP_PAIR_CONFLICT       → Phase 5
MAX_PARENT_LIMIT_REACHED         → Phase 5
full multi-generation cycle behavior → Phase 5
SHARE_LINK_INVALID              → Phase 9
SHARE_LINK_EXPIRED              → Phase 9
SHARE_LINK_DISABLED             → Phase 9
```

`RELATIONSHIP_CYCLE_DETECTED` may describe the currently detected direct cycle. Phase 5 expands the invariant to cycles of any depth and must expand its tests accordingly.

Do not add future behavior merely to exercise a reserved code.

---

## Central Error Design

Use one error-definition source, conceptually:

```ts
const errorDefinitions = {
  UNAUTHENTICATED: {
    status: 401,
    message: "You must be signed in to continue.",
  },
  // ...
} as const;
```

Derive the error-code type from this catalog where practical.

`AppError` should receive a code and optional safe overrides, conceptually:

```ts
new AppError("NOT_FOUND", {
  message: "Person not found.",
});
```

```ts
new AppError("VALIDATION_ERROR", {
  details: {
    fields: {
      birthDate: "Birth date does not match its precision.",
    },
  },
});
```

Requirements:

- `statusCode` is derived from the centralized code definition
- call sites do not independently choose a status for a known code
- public messages must be safe for clients
- `details` is optional and JSON-serializable
- `AppError` remains distinguishable from unexpected errors
- do not use string matching in the global handler to infer codes

Exact file grouping may vary, for example:

```txt
backend/src/errors/
  AppError.ts
  errorDefinitions.ts
  validationErrorDetails.ts

backend/src/dtos/
  apiError.ts
```

Keep a single source of truth; do not duplicate code/status maps in controllers, tests, and frontend.

---

## Error Handler Requirements

The global LineAge error handler must:

1. recognize `AppError`
2. return its catalog-derived status, code, safe message, and optional details
3. recognize malformed JSON from Express/body parsing and return `VALIDATION_ERROR` with `400`
4. treat every other thrown value as unexpected
5. log unexpected errors server-side
6. return only `INTERNAL_ERROR` and the generic public message for unexpected errors

Never return:

- stack traces
- raw Prisma errors or codes
- SQL or database connection details
- filesystem paths
- OAuth tokens or authentication internals
- raw Zod issue objects
- arbitrary messages from unknown thrown values

The response must not include the prototype fields:

```txt
status: "error"
top-level message
```

---

## Zod Validation Mapping

Replace `z.prettifyError()` responses with structured details.

Examples:

```txt
missing name
→ details.fields.name

invalid personId UUID
→ details.fields.personId

unknown request property
→ a stable field or form-level message

empty PATCH body
→ details.formErrors
```

Both body and route-parameter validation must use the same error-mapping utility.

Continue replacing `req.body` with parsed data. Parameter middleware should use validated parameter values where appropriate.

Do not add new validation rules in Phase 4. This phase changes representation, not the accepted domain values.

---

## Current Call-Site Migration

Update current LineAge errors as follows:

### Authentication and routing

- missing session → `UNAUTHENTICATED`
- unknown LineAge route → `NOT_FOUND`
- missing/inaccessible private tree → `NOT_FOUND`

### Trees

- normalized duplicate name → `TREE_NAME_ALREADY_EXISTS`, `409`
- missing tree → `NOT_FOUND`
- invalid request/params → `VALIDATION_ERROR`

### People

- missing person under validated tree → `NOT_FOUND`
- invalid person input or dates → `VALIDATION_ERROR`

### Relationships

- self-relationship → `VALIDATION_ERROR`
- participant missing from route tree → `PERSON_NOT_IN_TREE`
- exact duplicate → `RELATIONSHIP_ALREADY_EXISTS`
- existing spouse limit → `MAX_SPOUSE_LIMIT_REACHED`
- currently detected direct cycle → `RELATIONSHIP_CYCLE_DETECTED`
- missing relationship on delete → `NOT_FOUND`

Do not change which relationships are valid beyond these already implemented checks.

---

## Prisma Error Translation

Known persistence conflicts that can race with pre-checks must still be translated:

- tree unique constraint → `TREE_NAME_ALREADY_EXISTS`
- relationship unique constraint → `RELATIONSHIP_ALREADY_EXISTS`

Do not expose Prisma error code `P2002` to clients.

Unknown Prisma failures go through the generic `INTERNAL_ERROR` path.

Phase 4 does not add new database constraints or concurrency strategies.

---

## Frontend Compatibility

Add a small typed LineAge API error helper, conceptually:

```ts
type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

Provide reusable extraction for Axios errors instead of repeating unsafe nested property access.

Update current LineAge error-message consumers, including tree creation/list/delete flows, to read:

```txt
response.data.error.message
```

Do not change Better Auth client error handling.

Do not implement final field-level form rendering, relationship-modal live validation, or broad UX redesign. Those belong to Phase 7. Phase 4 only prevents existing UI error messages from breaking and establishes types/helpers for later use.

---

## In Scope

- define the exact LineAge error response DTO
- centralize active error codes, statuses, and default messages
- refactor `AppError`
- refactor the global error handler
- structure Zod validation errors
- handle malformed JSON safely as `400 VALIDATION_ERROR`
- migrate all current LineAge error throw sites
- translate known Prisma uniqueness races
- update backend tests to assert code/status/envelope/details
- add minimal frontend error extraction compatibility
- update README error documentation
- correct the stale Phase 3 manual-verification sentence if it remains in `main`

---

## Out of Scope

Do not include:

- new relationship validity rules
- spouse/parent-child pair conflicts
- max-two-parents enforcement
- full ancestor-cycle implementation
- concurrency-safe relationship invariant redesign
- new person/tree validation rules
- final frontend forms or inline field-error UI
- loading/toast/modal redesign
- share-link behavior or errors
- public routes
- API success DTO changes
- Better Auth response wrapping
- request IDs, tracing systems, or observability platforms
- global logging redesign
- schema migrations
- lint cleanup unrelated to touched error infrastructure

---

## Security Requirements

- private resource errors must not reveal cross-owner existence
- unexpected responses must never reuse an unknown error's message
- error details must contain validation/domain information only
- do not include request bodies, cookies, headers, sessions, tokens, or secrets in responses
- do not expose Prisma model contents through error details
- keep server logging separate from client-safe output
- preserve Better Auth boundaries
- preserve successful response DTOs from Phase 3

---

## Implementation Order

1. Correct the stale Phase 3 verification-record sentence.
2. Define the Phase 4 error response and validation-details DTOs.
3. Add the centralized active error catalog.
4. Refactor `AppError` to be code-driven.
5. Refactor the global error handler and malformed-JSON handling.
6. Add the shared Zod-to-details mapper.
7. Migrate auth, ownership, route, tree, person, and relationship call sites.
8. Translate known Prisma unique conflicts.
9. Add/update backend unit and integration tests.
10. Add minimal frontend LineAge error extraction and update current consumers.
11. Update README.
12. Run the Phase 4 validation plan and update the checklist only with verified results.

---

## README Impact Assessment

README update is required because the public LineAge error contract and frontend/backend integration change.

Document:

- the `{ error: { code, message, details? } }` envelope
- validation details shape
- representative status/code examples
- that Better Auth endpoints keep Better Auth's own response contract

Do not document Phase 5 relationship behavior or Phase 9 sharing errors as implemented.

---

## Phase Completion Criteria

Phase 4 is complete when:

- every LineAge-owned error response uses the approved envelope
- no LineAge error returns `status: "error"` or a top-level `message`
- handled errors use centralized codes and statuses
- Zod errors provide structured field/form details
- malformed JSON returns safe `400 VALIDATION_ERROR`
- unexpected errors return generic `500 INTERNAL_ERROR`
- no internal information is leaked
- current tree/person/relationship/auth-boundary regressions pass
- current frontend error messages read the new contract
- backend and frontend build
- README describes the implemented contract
- Phase 3 success DTOs remain unchanged
- Phase 5, Phase 7, and Phase 9 behavior remains deferred

