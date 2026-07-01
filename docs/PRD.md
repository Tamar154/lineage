# LineAge PRD

## 1. Product Overview

**Product name:** LineAge

**Product type:** Responsive web application

**One-sentence description:**
LineAge is a web app that lets users create, edit, visualize, and privately share family trees.

## 2. Primary User

The primary user is someone who wants to organize family information into a clear visual structure.

## 3. Core User Need

The user wants to:

> Create a family tree, add people and relationships, and see the family structure clearly.

## 4. V1 Product Scope

LineAge V1 supports:

- user signup and login
- multiple private family trees per user
- empty tree creation
- people creation, editing, and deletion
- parent/child/spouse relationship creation
- relationship deletion
- automatic family tree visualization
- disconnected family groups inside the same tree
- isolated people inside the same tree
- frontend-only search inside a tree editor
- private-by-default trees
- temporary public read-only share links
- disabling and regenerating share links

## 5. Explicitly Out of Scope for V1

The following are not part of V1:

- native mobile app
- file uploads
- profile pictures
- document uploads
- edit-sharing
- collaboration
- comments
- version history
- undo history
- tree merge
- public tree search
- dashboard search
- public shared-tree search
- DNA/genealogy matching
- adoption
- divorce
- step-parent relationships
- half-sibling relationships
- ex-spouse relationships
- manual node positioning
- drag-to-create relationships
- relationship editing
- upload storage
- caching

## 6. Core Product Flow

1. User signs up or logs in.
2. User lands on dashboard.
3. User creates a new tree.
4. Tree may be empty.
5. UI prompts user to add the first person.
6. User adds people.
7. User creates relationships.
8. Backend validates relationship rules.
9. User sees the family tree visually.
10. User can edit people and delete relationships.
11. User can optionally generate a public read-only link.

## 7. Technology Stack

### Frontend

- React
- Vite
- TypeScript
- React Flow
- Tailwind CSS
- shadcn/ui

### Backend

- Node.js
- Express
- TypeScript
- REST API

### Database

- PostgreSQL
- Prisma

### Authentication

- Better Auth
- email/password login
- Google login

### Testing

- Vitest for unit tests
- Vitest + test PostgreSQL database for integration tests
- Playwright for end-to-end tests

## 8. Repository Structure Decision

The current repository structure stays:

```txt
backend/
frontend/
```

Do not refactor to `apps/api` and `apps/web`.

## 9. Authentication Requirements

Better Auth owns authentication.

LineAge does not build or maintain a custom authentication system.

Better Auth owns:

- users
- sessions
- accounts
- verification
- password/OAuth mechanics

LineAge owns:

- trees
- people
- relationships
- share links
- ownership rules around tree access

LineAge stores the authenticated Better Auth user ID as:

```txt
Tree.ownerId
```

## 10. Tree Requirements

A user can create multiple trees.

Each tree has exactly one owner.

Tree fields:

- `name`
- `normalizedName`
- `description`

Rules:

- tree name is required
- tree name max length is 100 characters
- tree description is optional
- tree description max length is 500 characters
- tree names are unique per owner
- uniqueness is case-insensitive after trimming
- empty optional description is stored as `null`
- a tree may be empty
- deleting a tree deletes its people, relationships, and share link

## 11. Person Requirements

Required person field:

- `firstName`

Optional person fields:

- `lastName`
- `gender`
- `birthDate`
- `deathDate`
- `birthPlace`
- `biography`

Rules:

- first name is required
- first name max length is 100 characters
- last name max length is 100 characters
- birth place max length is 150 characters
- biography max length is 2,000 characters
- optional empty strings are stored as `null`
- person names are not unique
- duplicate people are allowed

## 12. Gender Behavior

Gender enum:

```ts
enum Gender {
  MALE
  FEMALE
  OTHER
  UNKNOWN
}
```

Rules:

- default is `UNKNOWN`
- gender is optional from user perspective
- gender does not affect relationship validity
- gender is shown in details panel
- gender is not shown on tree node in V1
- gender affects spouse visual ordering only

## 13. Date Behavior

Dates support partial precision:

- year only
- month/year
- full date

Fields:

```ts
birthDateValue: string | null;
birthDatePrecision: DatePrecision | null;
deathDateValue: string | null;
deathDatePrecision: DatePrecision | null;
```

Precision enum:

```ts
enum DatePrecision {
  YEAR
  MONTH
  DAY
}
```

Rules:

- do not invent missing date parts
- dates cannot be in the future
- death date cannot be before birth date
- partial dates are validated as ranges

Examples:

```txt
1920       -> YEAR
1920-03    -> MONTH
1920-03-12 -> DAY
```

## 14. Relationship Requirements

User-facing relationship options:

- parent
- child
- spouse

Stored relationship types:

```ts
enum RelationshipType {
  PARENT_CHILD
  SPOUSE
}
```

Storage meaning:

For `PARENT_CHILD`:

```txt
person1Id = parent
person2Id = child
```

For `SPOUSE`:

```txt
person1Id/person2Id are normalized by backend logic.
Spouse direction has no family meaning.
```

Rules:

- both people must belong to the same tree
- a person cannot relate to themselves
- duplicate relationships are not allowed
- a pair cannot have both spouse and parent-child relationship
- max 1 spouse per person
- max 2 parents per child
- parent-child relationships must not create cycles
- adding spouse is not blocked because either person has children with someone else
- relationship edits are not supported in V1
- changing a relationship means deleting old relationship and creating a new one
- deleting a relationship does not delete people
- deleting a person deletes connected relationships

## 15. Disconnected Groups

LineAge allows disconnected family groups and isolated people inside the same tree.

The UI renders them as separate groups/sections.

The backend does not block disconnected graphs.

## 16. Visual Tree Requirements

The visual tree uses React Flow.

Rules:

- automatic layout only
- no manual node positioning
- no saved layout positions
- backend returns family data, not React Flow positions
- frontend calculates layout
- frontend detects connected components
- frontend transforms people/relationships into React Flow nodes/edges
- user can zoom, pan, and select
- user cannot drag-create relationships
- user cannot directly edit on canvas

Tree nodes show:

- person name only

Details panel shows:

- gender
- birth/death dates
- birth place
- biography
- edit/delete actions for owner

Desktop selection behavior:

- right-side details panel

Mobile selection behavior:

- bottom sheet or modal

## 17. Spouse and Co-Parent Visualization

Explicit spouses are visually grouped as a couple.

If two parents share a child but are not spouses:

- align them as co-parents when possible
- do not visually group them as spouses
- do not imply they are a couple

Children appear under both known parents.

## 18. Ordering Rules

Children:

1. dated children oldest to youngest
2. partial dates compare using earliest possible date
3. undated children appear after dated children
4. fallback order is created date

Spouses:

- if exactly one `FEMALE` and one `MALE`, female appears left and male right
- otherwise use stable fallback order

Manual sibling ordering is out of scope.

## 19. Search Requirements

Search exists only inside a specific tree editor.

Rules:

- frontend-only
- searches loaded people in the current tree
- searches first name and last name
- no dashboard search
- no public search
- no global search

## 20. Public Sharing Requirements

Trees are private by default.

Owner can generate a public view-only link.

Rules:

- public link requires no login
- public link is read-only
- public viewers can see all person fields
- public viewers can pan, zoom, and select
- public viewers cannot edit
- public viewers cannot search/filter in V1
- owner can disable link anytime
- owner can regenerate link
- regeneration invalidates old link
- links expire
- default expiration is 30 days

Expiration presets:

- 24 hours
- 7 days
- 30 days
- 90 days

Share token decision:

- store hashed token
- do not store raw token
- backend returns full URL only when generated/regenerated
- if user loses link, user regenerates it

## 21. Error Response Format

All API errors use:

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
    "code": "TREE_NAME_ALREADY_EXISTS",
    "message": "You already have a tree with this name.",
    "details": null
  }
}
```

Validation example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "details": {
      "fields": {
        "name": "Tree name is required."
      }
    }
  }
}
```

Common error codes:

```txt
UNAUTHENTICATED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
TREE_NAME_ALREADY_EXISTS
PERSON_NOT_IN_TREE
RELATIONSHIP_ALREADY_EXISTS
RELATIONSHIP_PAIR_CONFLICT
MAX_SPOUSE_LIMIT_REACHED
MAX_PARENT_LIMIT_REACHED
RELATIONSHIP_CYCLE_DETECTED
SHARE_LINK_INVALID
SHARE_LINK_EXPIRED
SHARE_LINK_DISABLED
INTERNAL_ERROR
```

Feature-specific `403` vs `404` behavior is TBD and should be decided later per feature.

## 22. Testing Strategy

LineAge V1 uses:

- unit tests
- integration tests
- end-to-end tests

Unit tests cover:

- date parsing/validation
- partial date comparison
- string normalization
- tree name normalization
- relationship conversion
- spouse ID normalization
- cycle detection
- connected component detection
- layout helpers
- frontend search helpers

Integration tests cover:

- tree CRUD
- person CRUD
- relationship validation
- ownership
- share links
- validation errors
- cascade deletes

E2E tests cover:

- signup/login
- create tree
- add people
- create relationships
- invalid relationship blocked
- generate public link
- public read-only view
- disabled public link no longer works

## 23. Build Milestones

### Milestone 1: Backend + Minimal UI

Includes:

- Better Auth setup
- tree CRUD
- person CRUD
- relationship CRUD
- validation rules
- simple non-visual UI/debug UI
- tests for core backend rules

### Milestone 2: Visual Tree

Includes:

- React Flow setup
- graph conversion
- connected component detection
- automatic layout
- disconnected group rendering
- selection/details panel
- frontend search inside tree

### Milestone 3: Sharing

Includes:

- generate public link
- regenerate link
- disable link
- public read-only page
- public access validation

### Milestone 4: Polish

Includes:

- empty states
- loading states
- error states
- delete confirmations
- responsive viewing polish
- test cleanup

## 24. Open Questions

The following are not finalized:

- exact visual design palette
- exact typography
- exact logo/brand treatment
- exact deceased-person visual treatment
- feature-specific `403` vs `404` behavior
- exact request/response DTOs for all endpoints
- exact React Flow layout algorithm details
- deployment provider
- database hosting
- CI/CD setup
