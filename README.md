# Lineage

Lineage is a full-stack family tree application that lets users create private family trees, add people, define relationships, and view the tree as an interactive graph.

The project is split into a TypeScript/Express backend and a React/Vite frontend.

## Features

- User registration and login
- JWT-based authentication with an HTTP-only cookie
- User-owned family trees
- Create, view, and delete trees
- Add, edit, view, and delete people inside a tree
- Add parent-child and spouse relationships
- Relationship validation to prevent invalid or duplicate connections
- Interactive family tree graph visualization
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
- Prisma
- PostgreSQL / Neon
- JWT authentication
- Zod validation
- Vitest
- Supertest
- ESLint

## Project Structure

```txt
lineage/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── tests/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── vitest.config.ts
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── types/
│   │   ├── utils/
│   │   └── App.tsx
│   └── package.json
│
├── README.md
└── LICENSE
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- A PostgreSQL-compatible database

The backend is configured to use Prisma with the Neon adapter, so a Neon database works well for local development.

## Installation

Clone the repository:

```bash
git clone https://github.com/Tamar154/lineage.git
cd lineage
```

## Backend Setup

Go into the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=8000

DATABASE_URL="your_database_url"
DIRECT_URL="your_direct_database_url"

TEST_DATABASE_URL="your_test_database_url"
TEST_DIRECT_URL="your_test_direct_database_url"

JWT_SECRET="your_jwt_secret"
```

> Important: use a separate test database for `TEST_DATABASE_URL`. The test setup clears the database before running tests.

Generate the Prisma client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

Start the backend server:

```bash
npm run dev
```

The backend should now be running at:

```txt
http://localhost:8000
```

## Frontend Setup

Open a second terminal and go into the frontend directory:

```bash
cd frontend
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The frontend should now be running at:

```txt
http://localhost:5173
```

By default, the frontend sends API requests to:

```txt
http://localhost:8000/api
```

## Available Scripts

### Backend

Run these from the `backend/` directory.

| Command              | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | Start the backend in development mode                  |
| `npm run test`       | Run backend tests once                                 |
| `npm run test:watch` | Run backend tests in watch mode                        |
| `npm run lint`       | Run ESLint                                             |
| `npm run lint:fix`   | Run ESLint and automatically fix issues where possible |

### Frontend

Run these from the `frontend/` directory.

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite development server    |
| `npm run build`   | Build the frontend for production    |
| `npm run lint`    | Run ESLint                           |
| `npm run preview` | Preview the production build locally |

## Environment Variables

### Backend

| Variable            | Description                                                              |
| ------------------- | ------------------------------------------------------------------------ |
| `PORT`              | Backend server port. Use `8000` to match the frontend API configuration. |
| `DATABASE_URL`      | Database connection URL used by the app.                                 |
| `DIRECT_URL`        | Direct database URL used by Prisma commands.                             |
| `TEST_DATABASE_URL` | Database connection URL used while running tests.                        |
| `TEST_DIRECT_URL`   | Direct database URL used by Prisma commands in test mode.                |
| `JWT_SECRET`        | Secret key used to sign JWT authentication tokens.                       |

## API Overview

Base URL:

```txt
http://localhost:8000/api
```

Most routes are protected and require the user to be logged in. Authentication is handled through an HTTP-only `jwt` cookie.

### Authentication

| Method | Endpoint         | Description              |
| ------ | ---------------- | ------------------------ |
| `POST` | `/auth/register` | Register a new user      |
| `POST` | `/auth/login`    | Log in an existing user  |
| `POST` | `/auth/logout`   | Log out the current user |

#### Register

```http
POST /api/auth/register
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

#### Login

```http
POST /api/auth/login
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Trees

| Method   | Endpoint         | Description                                   |
| -------- | ---------------- | --------------------------------------------- |
| `GET`    | `/trees`         | Get all trees owned by the authenticated user |
| `POST`   | `/trees`         | Create a new tree                             |
| `GET`    | `/trees/:treeId` | Get a specific tree                           |
| `DELETE` | `/trees/:treeId` | Delete a specific tree                        |

#### Create Tree

```http
POST /api/trees
```

Request body:

```json
{
  "name": "My Family Tree"
}
```

### Persons

| Method   | Endpoint                     | Description              |
| -------- | ---------------------------- | ------------------------ |
| `POST`   | `/trees/:treeId/persons`     | Add a person to a tree   |
| `GET`    | `/trees/:treeId/persons`     | Get all people in a tree |
| `GET`    | `/trees/:treeId/persons/:id` | Get one person by ID     |
| `PUT`    | `/trees/:treeId/persons/:id` | Update a person          |
| `DELETE` | `/trees/:treeId/persons/:id` | Delete a person          |

#### Create or Update Person

```http
POST /api/trees/:treeId/persons
```

```http
PUT /api/trees/:treeId/persons/:id
```

Request body:

```json
{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "birthDate": "1815-12-10",
  "deathDate": "1852-11-27",
  "bio": "English mathematician and writer."
}
```

`birthDate`, `deathDate`, and `bio` are optional.

### Relationships

| Method   | Endpoint                           | Description                           |
| -------- | ---------------------------------- | ------------------------------------- |
| `POST`   | `/trees/:treeId/relationships`     | Add a relationship between two people |
| `GET`    | `/trees/:treeId/relationships`     | Get all relationships in a tree       |
| `GET`    | `/trees/:treeId/relationships/:id` | Get one relationship by ID            |
| `PUT`    | `/trees/:treeId/relationships/:id` | Update a relationship                 |
| `DELETE` | `/trees/:treeId/relationships/:id` | Delete a relationship                 |

#### Create or Update Relationship

```http
POST /api/trees/:treeId/relationships
```

```http
PUT /api/trees/:treeId/relationships/:id
```

Request body:

```json
{
  "personAId": "person-id-1",
  "personBId": "person-id-2",
  "type": "PARENT"
}
```

Supported relationship types:

```txt
PARENT
SPOUSE
```

### Graph

| Method | Endpoint               | Description                                                  |
| ------ | ---------------------- | ------------------------------------------------------------ |
| `GET`  | `/trees/:treeId/graph` | Get graph-ready tree data including people and relationships |

#### Graph Response Shape

```json
{
  "status": "success",
  "data": {
    "id": "tree-id",
    "name": "My Family Tree",
    "persons": [
      {
        "id": "person-id",
        "firstName": "Ada",
        "lastName": "Lovelace",
        "birthDate": "1815-12-10T00:00:00.000Z",
        "deathDate": "1852-11-27T00:00:00.000Z",
        "bio": "English mathematician and writer."
      }
    ],
    "relationships": [
      {
        "id": "relationship-id",
        "personAId": "person-id-1",
        "personBId": "person-id-2",
        "type": "PARENT"
      }
    ]
  }
}
```

## Data Model

The main database models are:

- `User` - owns one or more family trees
- `Tree` - belongs to a user and contains people and relationships
- `Person` - represents a person in a family tree
- `Relationship` - connects two people in a tree
- `RelationshipType` - supports `PARENT` and `SPOUSE`

## Validation and Authorization

The backend validates request bodies and route parameters with Zod.

Protected routes require a valid JWT cookie. Tree-specific routes also verify that the requested tree belongs to the authenticated user before returning or modifying data.

Relationship creation includes validation for cases such as:

- A person cannot have a relationship with themselves
- Both people must belong to the same tree
- Duplicate relationships are not allowed
- Circular parent-child relationships are not allowed

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

Make sure your test environment variables point to a separate test database, because the test setup clears the database before running.

## Notes for Development

- The frontend expects the backend API to run on `http://localhost:8000/api`.
- The backend allows CORS requests from `http://localhost:5173`.
- Authentication depends on cookies, so API requests must include credentials.
- The frontend uses React Flow and ELK.js to render and lay out the family tree graph.
- Prisma client output is configured under `backend/src/generated/prisma`.

## Credits

Lineage icon created by [gravisio - Flaticon](https://www.flaticon.com/free-icons/lineage).

## License

This project is licensed under the MIT License.
