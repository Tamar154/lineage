# LineAge API Specification

## 1. API Overview

LineAge uses a REST API.

Private application endpoints require authentication.

Public shared-tree endpoints do not require authentication but are read-only.

Better Auth owns authentication endpoints.

LineAge owns tree, person, relationship, share-link, and public tree endpoints.

## 2. API Principles

- Backend is the source of truth.
- Frontend validation is only for user experience.
- Backend repeats all validation.
- React Flow layout is not stored.
- Backend returns family data, not visual node positions.
- Public endpoints never allow mutation.
- Only tree owner can mutate private tree data.
- Relationship writes must go through relationship service logic.

## 3. Auth Endpoints

Owned by Better Auth:

```txt
/api/auth/*
```

Conceptual auth capabilities:

```txt
email/password signup
email/password signin
Google signin
signout
session lookup
```

LineAge may optionally expose:

```txt
GET /api/me
```

Purpose:

- return current authenticated user in app-friendly shape

Status:

- optional
- can be added if useful for frontend

## 4. Tree Endpoints

### List Trees

```txt
GET /api/trees
```

Auth:

- required

Purpose:

- list trees owned by current user

Response includes tree metadata.

---

### Create Tree

```txt
POST /api/trees
```

Auth:

- required

Purpose:

- create a new tree for current user

Validation:

- name required
- name max 100 chars
- name unique per owner, case-insensitive after trimming
- description optional
- description max 500 chars

Request shape:

```json
{
  "name": "Cohen Family",
  "description": "Optional description"
}
```

Exact DTO is TBD.

---

### Get Tree Metadata

```txt
GET /api/trees/:treeId
```

Auth:

- required

Purpose:

- get metadata for one owned tree

Returns:

- tree ID
- name
- description
- timestamps if needed

Does not need to return people or relationships.

---

### Update Tree

```txt
PATCH /api/trees/:treeId
```

Auth:

- required
- owner only

Purpose:

- update tree metadata

Can update:

- name
- description

Validation:

- same as create tree
- name uniqueness still enforced per owner

---

### Delete Tree

```txt
DELETE /api/trees/:treeId
```

Auth:

- required
- owner only

Purpose:

- permanently delete tree

Backend behavior:

- deletes tree
- cascades people
- cascades relationships
- cascades share link

Frontend behavior:

- requires typed confirmation by tree name

## 5. Full Tree Endpoint

```txt
GET /api/trees/:treeId/full
```

Auth:

- required
- owner only

Purpose:

- main data endpoint for tree editor
- returns tree metadata
- returns all people
- returns all relationships
- may return share-link status

Response concept:

```json
{
  "tree": {
    "id": "tree-id",
    "name": "Cohen Family",
    "description": null
  },
  "people": [],
  "relationships": [],
  "shareLink": {
    "hasLink": true,
    "expiresAt": "2026-07-19T00:00:00.000Z",
    "disabledAt": null,
    "isExpired": false
  }
}
```

Exact DTO is TBD.

This replaces the current learning-project `/graph` endpoint.

## 6. People Endpoints

V1 uses `people`, not `persons`.

### Create Person

```txt
POST /api/trees/:treeId/people
```

Auth:

- required
- owner only

Purpose:

- create a person inside a tree

Fields:

- firstName
- lastName
- gender
- birthDateValue
- birthDatePrecision
- deathDateValue
- deathDatePrecision
- birthPlace
- biography

Validation:

- first name required
- first name max 100 chars
- last name optional, max 100 chars
- birth place optional, max 150 chars
- biography optional, max 2,000 chars
- optional empty strings stored as null
- dates cannot be in future
- death date cannot be before birth date

Shortcut person creation:

- this same endpoint may be used with only `firstName`

Exact DTO is TBD.

---

### Update Person

```txt
PATCH /api/trees/:treeId/people/:personId
```

Auth:

- required
- owner only

Purpose:

- update person fields

Validation:

- same as create person
- first name cannot become empty

---

### Delete Person

```txt
DELETE /api/trees/:treeId/people/:personId
```

Auth:

- required
- owner only

Purpose:

- permanently delete person

Backend behavior:

- deletes person
- deletes connected relationships via cascade

Frontend behavior:

- typed confirmation by person first name
- UI should show enough context because duplicate first names are allowed

## 7. Relationship Endpoints

### Create Relationship

```txt
POST /api/trees/:treeId/relationships
```

Auth:

- required
- owner only

Purpose:

- create parent, child, or spouse relationship

User-facing relation values:

```txt
PARENT
CHILD
SPOUSE
```

Backend converts to stored types:

```txt
PARENT_CHILD
SPOUSE
```

Example request concept:

```json
{
  "relation": "PARENT",
  "personAId": "person-1",
  "personBId": "person-2"
}
```

Meaning:

```txt
PARENT: personA is parent of personB
CHILD: personA is child of personB
SPOUSE: personA is spouse of personB
```

Validation:

- both people must belong to same tree
- person cannot relate to self
- duplicate relationship blocked
- same pair cannot have spouse and parent-child relationship
- max 1 spouse per person
- max 2 parents per child
- parent-child cycles blocked

Exact DTO is TBD.

---

### Delete Relationship

```txt
DELETE /api/trees/:treeId/relationships/:relationshipId
```

Auth:

- required
- owner only

Purpose:

- delete relationship

Backend behavior:

- deletes relationship only
- does not delete people

Frontend behavior:

- normal confirmation dialog is enough

## 8. Share Link Endpoints

### Get Share Link Status

```txt
GET /api/trees/:treeId/share-link
```

Auth:

- required
- owner only

Purpose:

- get current share-link status

Does not return raw token.

Response concept:

```json
{
  "hasLink": true,
  "expiresAt": "2026-07-19T00:00:00.000Z",
  "disabledAt": null,
  "isExpired": false
}
```

Exact DTO is TBD.

---

### Generate or Regenerate Share Link

```txt
POST /api/trees/:treeId/share-link
```

Auth:

- required
- owner only

Purpose:

- generate or regenerate public read-only link

Allowed expiration values:

```txt
24h
7d
30d
90d
```

Default:

```txt
30d
```

Request concept:

```json
{
  "expiresIn": "30d"
}
```

Response concept:

```json
{
  "url": "https://lineage.app/public/raw-token",
  "expiresAt": "2026-07-19T00:00:00.000Z"
}
```

Rules:

- raw token returned only at generation/regeneration time
- database stores only token hash
- regenerating invalidates old token

Exact DTO is TBD.

---

### Disable Share Link

```txt
DELETE /api/trees/:treeId/share-link
```

Auth:

- required
- owner only

Purpose:

- disable current share link

Implementation:

- set `disabledAt = now()`
- do not necessarily physically delete row

## 9. Public Tree Endpoint

```txt
GET /api/public/trees/:token
```

Auth:

- not required

Purpose:

- allow anyone with valid public token to view tree

Backend behavior:

- hash token
- find matching token hash
- reject invalid token
- reject expired token
- reject disabled token
- return read-only tree data

Response includes:

- tree metadata
- people
- relationships

Response must not include:

- owner ID
- auth data
- share-link internals
- token hash
- edit permissions

Public view rules:

- read-only
- all person fields visible
- pan/zoom/select allowed
- no mutation allowed
- no public search/filter in V1

## 10. Error Format

All LineAge API errors use:

```ts
type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

Example:

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

HTTP status mapping:

```txt
400 Bad Request        -> invalid input / validation
401 Unauthorized       -> not logged in
403 Forbidden          -> logged in but not allowed
404 Not Found          -> missing/inaccessible resource
409 Conflict           -> domain conflict
500 Internal Error     -> unexpected server error
```

Feature-specific `403` vs `404` behavior is TBD.

## 11. Endpoints Intentionally Excluded from V1

Do not implement these in V1:

```txt
GET    /api/trees/search
GET    /api/trees/:treeId/people/:personId
GET    /api/trees/:treeId/relationships
PATCH  /api/trees/:treeId/relationships/:relationshipId
POST   /api/trees/:treeId/uploads
POST   /api/trees/:treeId/collaborators
POST   /api/trees/:treeId/layout
POST   /api/trees/:treeId/import
POST   /api/trees/:treeId/export
GET    /api/public/trees/:token/search
```

Reason:

- unnecessary for V1
- covered by `/full`
- explicitly out of scope
- would add complexity before core product is stable

## 12. Current Project Refactor Note

The current learning implementation may contain routes that are not part of this V1 API.

The V1 API in this document is the source of truth.

Current implementation details should not override this API specification.
