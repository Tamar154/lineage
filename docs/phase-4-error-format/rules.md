# Phase 4 V1 Error Format Refactor Rules

Read first:

- `docs/PRD.md`
- `docs/API.md`
- `docs/phase-4-error-format/phase-4-error-refactor.md`
- `docs/phase-4-error-format/phase-4-error-testing.md`
- `docs/phase-4-error-format/phase-4-error-checklist.md`

The V1 documents are the source of truth. Implement **Phase 4: V1 Error Format Refactor** only.

## Goal

Give every LineAge-owned error a predictable, typed, safe response before later frontend form work depends on it.

## Required LineAge error response

```ts
type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

Rules:

- top-level key is exactly `error`
- omit `details` when absent
- remove `status: "error"`
- remove top-level `message`
- preserve Phase 3 `{ data: ... }` success responses
- preserve empty `204` delete responses

## Better Auth boundary

Apply this contract to LineAge domain routes and LineAge's `requireAuth` middleware.

Do not wrap or redefine Better Auth responses under:

```txt
/api/auth/*
```

Better Auth continues to own signup, signin, OAuth, signout, session, and related errors.

## Active Phase 4 codes

Use these mappings:

```txt
UNAUTHENTICATED                 401
FORBIDDEN                       403
NOT_FOUND                       404
VALIDATION_ERROR                400
TREE_NAME_ALREADY_EXISTS        409
PERSON_NOT_IN_TREE              404
RELATIONSHIP_ALREADY_EXISTS     409
MAX_SPOUSE_LIMIT_REACHED        409
RELATIONSHIP_CYCLE_DETECTED     409
INTERNAL_ERROR                  500
```

Keep private cross-owner tree access concealed through `404 NOT_FOUND`.

Do not activate behavior for:

```txt
RELATIONSHIP_PAIR_CONFLICT
MAX_PARENT_LIMIT_REACHED
SHARE_LINK_INVALID
SHARE_LINK_EXPIRED
SHARE_LINK_DISABLED
```

Those belong to later phases.

## Centralized design

- Keep one catalog of active code, status, and default public message.
- Derive typed codes from that catalog where practical.
- Refactor `AppError` to receive a code, not an arbitrary status.
- Derive `statusCode` from the code definition.
- Allow only deliberate client-safe message overrides and JSON-safe details.
- Do not duplicate status mappings across controllers and services.
- Do not infer codes through message-string matching.

## Validation details

Use:

```ts
type ValidationErrorDetails = {
  fields?: Record<string, string>;
  formErrors?: string[];
};
```

- Map Zod paths to dot-notation field keys.
- Keep the first useful message per field.
- Map root/empty-path issues to `formErrors`.
- Omit empty sections.
- Do not expose raw Zod issues or `z.prettifyError()` output.
- Use the same mapper for body and parameter validation.
- Do not add new validation rules.

## Error handler

- Treat the caught value safely as `unknown`.
- Serialize `AppError` through the approved envelope.
- Map malformed JSON to `400 VALIDATION_ERROR`.
- Map unknown failures to `500 INTERNAL_ERROR`.
- Return a generic public message for unexpected errors.
- Log unexpected errors server-side.
- Never expose unknown error messages, stacks, Prisma errors, SQL, paths, secrets, tokens, sessions, or auth internals.

## Current call-site mappings

Authentication and resources:

- missing LineAge session → `UNAUTHENTICATED`
- unknown route → `NOT_FOUND`
- missing/inaccessible private tree → `NOT_FOUND`
- missing person/relationship → `NOT_FOUND`

Trees:

- invalid input → `VALIDATION_ERROR`
- normalized duplicate, including Prisma race → `TREE_NAME_ALREADY_EXISTS`

People:

- invalid input/partial dates → `VALIDATION_ERROR`

Relationships:

- self-relationship → `VALIDATION_ERROR`
- participant outside route tree → `PERSON_NOT_IN_TREE`
- exact/reverse-normalized duplicate → `RELATIONSHIP_ALREADY_EXISTS`
- existing spouse-limit check → `MAX_SPOUSE_LIMIT_REACHED`
- existing direct-cycle check → `RELATIONSHIP_CYCLE_DETECTED`

Do not change relationship validity rules in this phase.

## Persistence translation

- Translate known tree `P2002` to `TREE_NAME_ALREADY_EXISTS`.
- Translate known relationship `P2002` to `RELATIONSHIP_ALREADY_EXISTS`.
- Never expose Prisma codes.
- Unknown persistence failures use the generic internal-error path.
- Do not add schema constraints or concurrency redesign.

## Frontend compatibility

- Add a typed LineAge error response/extraction helper.
- Update current LineAge consumers of `response.data.message`.
- Provide safe fallbacks for malformed or non-LineAge errors.
- Keep Better Auth client handling separate.
- Do not build final field-level form UI, new notifications, or form redesign.

## Ownership and security

- Never reveal whether another user's private tree exists.
- Never put owner IDs, normalized names, model data, request bodies, cookies, headers, or sessions in error details.
- Never return stack traces or internal exception messages.
- Preserve every ownership regression test.
- Preserve Phase 3 response field boundaries.

## Explicitly out of scope

Do not include:

- spouse/parent-child pair conflict behavior
- max-two-parents behavior
- complete ancestor-cycle detection
- concurrency-safe spouse enforcement
- new person/tree validation requirements
- final frontend form/error presentation
- share-link/public errors
- success response changes
- Better Auth error wrapping
- database migrations
- logging/observability platform work
- unrelated lint cleanup

## Testing

Test:

- exact error envelope
- every active code/status mapping
- validation field/form details
- malformed JSON
- sanitized unexpected errors
- current tree/person/relationship error paths
- private ownership concealment
- known uniqueness translation
- Better Auth boundary
- frontend extraction
- unchanged success responses

Keep shared-database test files serial and deterministic.

## Documentation integrity

Update `docs/phase-4-error-format/phase-4-error-checklist.md` only as work is completed. Record automated and manual verification separately. Do not claim tests pass unless they were run successfully.

## README impact

README update is required. Document the implemented LineAge error envelope, validation details concept, representative mappings, and Better Auth boundary.

Do not document Phase 5 or Phase 9 errors as implemented.

If a missing product decision would materially change the public error contract, stop and ask rather than inferring it from prototype messages.
