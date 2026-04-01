# lineage

## Endpoints

#### Authentication:

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login an existing user
- `POST /api/auth/logout` - Logout the current user

#### Trees:

- `GET /api/trees` - Get all trees for the authenticated user
- `GET /api/trees/:treeId` - Get a specific tree by ID
- `POST /api/trees` - Create a new tree
- `DELETE /api/trees/:treeId` - Delete a specific tree by ID

#### Persons:

- `POST /api/trees/:treeId/persons` - Add a new person to a specific tree
- `GET /api/trees/:treeId/persons` - Get all persons in a specific tree
- `GET /api/trees/:treeId/persons/:id` - Get a specific person by ID in a specific tree
- `PUT /api/trees/:treeId/persons/:id` - Update a specific person by ID in a specific tree
- `DELETE /api/trees/:treeId/persons/:id` - Delete a specific person by ID in a specific tree

#### Relationships:

- `POST /api/trees/:treeId/relationships` - Add a new relationship to a specific tree
- `GET /api/trees/:treeId/relationships` - Get all relationships in a specific tree
- `GET /api/trees/:treeId/relationships/:id` - Get a specific relationship by ID in a specific tree
- `PUT /api/trees/:treeId/relationships/:id` - Update a specific relationship by ID in a specific tree
- `DELETE /api/trees/:treeId/relationships/:id` - Delete a specific relationship by ID in a specific tree

#### Graph:

- `GET /api/trees/:treeId/graph` - Get the graph data for a specific tree

### Credits:

<a href="https://www.flaticon.com/free-icons/lineage" title="lineage icons">Lineage icons created by gravisio - Flaticon</a>
