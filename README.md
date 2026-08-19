# Lineage

Lineage is a full-stack family tree application that lets users create private family trees, add people, define relationships, and view each tree as an interactive graph.

The project is split into a TypeScript/Express backend and a React/Vite frontend.

## Features

- Email/password and Google authentication through Better Auth
- Session-based protected routes
- Multiple private family trees per authenticated user
- Create, view, update, and delete trees
- Add, edit, view, and delete people inside a tree
- Optional last names, gender, partial birth/death dates, birth place, and biography
- Parent-child and spouse relationships
- Relationship validation for self-links, duplicates, circular parent-child links, and the one-spouse-per-person rule
- Automatic interactive family-tree visualization
- PostgreSQL database access through Prisma
- Backend tests with Vitest and Supertest

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- React Flow (`@xyflow/react`)
- ELK.js for graph layout
- CSS Modules

### Backend

- Node.js
- Express
- TypeScript
- Better Auth
- Prisma
- PostgreSQL / Neon
- Zod validation
- Vitest
- Supertest
- ESLint

## Project Structure

```txt
lineage/
|-- backend/
|   |-- prisma/
|   |   |-- schema.prisma
|   |   `-- migrations/
|   |-- src/
|   |   |-- auth/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- tests/
|   |   |-- types/
|   |   |-- utils/
|   |   |-- validators/
|   |   |-- app.ts
|   |   `-- server.ts
|   |-- package.json
|   `-- vitest.config.ts
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- auth/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- styles/
|   |   |-- types/
|   |   |-- utils/
|   |   `-- App.tsx
|   `-- package.json
|-- docs/
|-- README.md
`-- LICENSE
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- A PostgreSQL-compatible database

The backend uses Prisma with the Neon adapter, so a Neon database works well for local development.

## Installation

Clone the repository:

```bash
git clone https://github.com/Tamar154/lineage.git
cd lineage
```

## Backend Setup

Go into the backend directory and install dependencies:

```bash
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env` and provide your database and authentication credentials:

```env
DATABASE_URL=
TEST_DATABASE_URL=
DIRECT_URL=
TEST_DIRECT_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_ORIGIN=http://localhost:5173

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Use separate application and direct connection URLs for your development and test databases. The test setup clears the test database, so never point the test variables at data you need to keep.

````

Generate the custom Prisma client in `backend/src/generated/prisma`:

```bash
npx prisma generate
````

Apply migrations to the development database:

```bash
npx prisma migrate dev
```

Start the backend server:

```bash
npm run dev
```

The backend runs at:

```txt
http://localhost:3000
```

## Frontend Setup

Open a second terminal, enter the frontend directory, and install dependencies:

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:5173
```

Start the frontend development server:

```bash
npm run dev
```

The frontend runs at:

```txt
http://localhost:5173
```

By default, application API requests are sent to `http://localhost:3000/api`, and authentication requests are handled by Better Auth on the same backend.

## Available Scripts

### Backend

Run these from the `backend/` directory.

| Command              | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | Start the backend in development mode                  |
| `npm run build`      | Type-check and compile the backend                     |
| `npm run test`       | Run backend tests once                                 |
| `npm run test:watch` | Run backend tests in watch mode                        |
| `npm run lint`       | Run ESLint                                             |
| `npm run lint:fix`   | Run ESLint and automatically fix issues where possible |

### Frontend

Run these from the `frontend/` directory.

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite development server    |
| `npm run build`   | Type-check and build the frontend    |
| `npm run lint`    | Run ESLint                           |
| `npm run preview` | Preview the production build locally |

## Environment Variables

### Backend

| Variable               | Description                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`         | Application connection URL for the development database                 |
| `TEST_DATABASE_URL`    | Application connection URL for the isolated test database               |
| `DIRECT_URL`           | Direct development database URL used by Prisma CLI commands             |
| `TEST_DIRECT_URL`      | Direct test database URL used by Prisma CLI commands in test mode       |
| `BETTER_AUTH_SECRET`   | Private secret used by Better Auth                                      |
| `BETTER_AUTH_URL`      | Backend origin used by Better Auth; defaults to `http://localhost:3000` |
| `FRONTEND_ORIGIN`      | Trusted frontend/CORS origin; defaults to `http://localhost:5173`       |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                                                  |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                                              |

### Frontend

| Variable            | Description                                                                            |
| ------------------- | -------------------------------------------------------------------------------------- |
| `VITE_API_URL`      | Backend origin; defaults to `http://localhost:3000`                                    |
| `VITE_FRONTEND_URL` | Frontend origin used for authentication callbacks; defaults to `http://localhost:5173` |

## API Overview

Application API base URL:

```txt
http://localhost:3000/api
```

Tree, person, relationship, and full-tree routes require an authenticated Better Auth session. Requests from the frontend include credentials so the backend can validate the session.

Successful LineAge JSON responses use `{ "data": ... }`. Successful deletes return `204 No Content` without a response body. Response DTOs expose only public resource fields; ownership, normalized names, nested tree IDs, and persistence timestamps for people and relationships are omitted.

### Authentication

Authentication is handled by Better Auth under `/api/auth/*`.

The application supports:

- Email/password signup and sign-in
- Google sign-in
- Sign-out
- Session-based protected routes

Better Auth owns the authentication endpoints; application domain routes are documented below.

### Trees

| Method   | Endpoint         | Description                                   |
| -------- | ---------------- | --------------------------------------------- |
| `GET`    | `/trees`         | Get all trees owned by the authenticated user |
| `POST`   | `/trees`         | Create a tree                                 |
| `GET`    | `/trees/:treeId` | Get an owned tree                             |
| `PATCH`  | `/trees/:treeId` | Update an owned tree                          |
| `DELETE` | `/trees/:treeId` | Delete an owned tree                          |
| `GET`    | `/trees/:treeId/full` | Load tree metadata, people, and relationships |

Tree names are trimmed and normalized for case-insensitive per-owner uniqueness. Descriptions are optional.

#### Create Tree

```http
POST /api/trees
```

```json
{
  "name": "My Family Tree",
  "description": "An optional description"
}
```

### People

| Method   | Endpoint                     | Description              |
| -------- | ---------------------------- | ------------------------ |
| `POST`   | `/trees/:treeId/people`                  | Add a person to a tree |
| `PATCH`  | `/trees/:treeId/people/:personId`        | Update a person        |
| `DELETE` | `/trees/:treeId/people/:personId`        | Delete a person        |

#### Create or Update Person

```http
POST /api/trees/:treeId/people
```

```http
PATCH /api/trees/:treeId/people/:personId
```

Example request body:

```json
{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "gender": "FEMALE",
  "birthDate": "1815-12-10",
  "birthDatePrecision": "DAY",
  "deathDate": "1852-11-27",
  "deathDatePrecision": "DAY",
  "birthPlace": "London",
  "biography": "English mathematician and writer."
}
```

Only `firstName` is required. Gender defaults to `UNKNOWN`; supported values are `MALE`, `FEMALE`, `OTHER`, and `UNKNOWN`. Dates support `YEAR`, `MONTH`, and `DAY` precision, and each supplied date must include its matching precision.

### Relationships

| Method   | Endpoint                           | Description                           |
| -------- | ---------------------------------- | ------------------------------------- |
| `POST`   | `/trees/:treeId/relationships`     | Add a relationship between two people |
| `DELETE` | `/trees/:treeId/relationships/:relationshipId` | Delete a relationship       |

#### Create Relationship

```http
POST /api/trees/:treeId/relationships
```

```json
{
  "personAId": "person-id-1",
  "personBId": "person-id-2",
  "relation": "PARENT"
}
```

Accepted request relations are `PARENT`, `CHILD`, and `SPOUSE`. `PARENT` means A is parent of B; `CHILD` means A is child of B. The response uses the canonical stored types `PARENT_CHILD` and `SPOUSE`, with spouse pairs normalized by the backend.

### Full Tree

| Method | Endpoint               | Description                                                  |
| ------ | ---------------------- | ------------------------------------------------------------ |
| `GET`  | `/trees/:treeId/full` | Get tree metadata, people, and relationships |

The response is `{ "data": { "tree": TreeDto, "people": PersonDto[], "relationships": RelationshipDto[] } }`. It contains family data only; the frontend generates React Flow positions and layout.

## Data Model

The main domain models are:

- `User` - authenticated through Better Auth and owns one or more family trees
- `Tree` - belongs to a user and contains people and relationships
- `Person` - represents a person in a family tree
- `Relationship` - connects two people in a tree as `PARENT_CHILD` or `SPOUSE`

Better Auth also persists its session and account data through Prisma.

## Validation and Authorization

The backend validates request bodies and route parameters with Zod.

Protected routes require a valid Better Auth session. Tree-specific routes verify that the requested tree belongs to the authenticated user before returning or modifying data.

Current relationship validation includes:

- A person cannot have a relationship with themselves
- Both people must belong to the same tree
- Duplicate relationships are not allowed
- Direct circular parent-child relationships are not allowed
- A person can have at most one spouse

## Testing

Backend tests are located in:

```txt
backend/src/tests
```

Run the test suite from the backend directory:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Tests use Vitest and Supertest. Ensure the test environment variables point to a separate test database because the test setup clears that database before running.

## Notes for Development

- The frontend expects the backend to run on `http://localhost:3000`.
- The backend allows credentialed CORS requests from `http://localhost:5173` by default.
- Authentication depends on Better Auth sessions, so API requests must include credentials.
- The frontend uses React Flow and ELK.js to render and lay out family trees.
- Prisma client output is configured under `backend/src/generated/prisma`.
- `README.md` describes the currently implemented project. `docs/PRD.md`, `docs/API.md`, and phase documents remain the source of truth for the V1 plan.
- When a change affects setup, authentication, environment variables, architecture, developer workflow, major user-visible features, or documented API usage, update `README.md` in the same PR.

## Credits

Lineage icon created by [gravisio - Flaticon](https://www.flaticon.com/free-icons/lineage).

## License

This project is licensed under the MIT License.
