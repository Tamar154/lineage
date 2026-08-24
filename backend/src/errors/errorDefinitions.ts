export const errorDefinitions = {
  UNAUTHENTICATED: {
    status: 401,
    message: "You must be signed in to continue.",
  },
  FORBIDDEN: {
    status: 403,
    message: "You do not have permission to perform this action.",
  },
  NOT_FOUND: {
    status: 404,
    message: "The requested resource was not found.",
  },
  VALIDATION_ERROR: {
    status: 400,
    message: "Some fields are invalid.",
  },
  TREE_NAME_ALREADY_EXISTS: {
    status: 409,
    message: "You already have a tree with this name.",
  },
  PERSON_NOT_IN_TREE: {
    status: 404,
    message: "One or more people were not found in this tree.",
  },
  RELATIONSHIP_ALREADY_EXISTS: {
    status: 409,
    message: "This relationship already exists.",
  },
  MAX_SPOUSE_LIMIT_REACHED: {
    status: 409,
    message: "A person cannot have more than one spouse.",
  },
  RELATIONSHIP_CYCLE_DETECTED: {
    status: 409,
    message: "This relationship would create a cycle.",
  },
  INTERNAL_ERROR: {
    status: 500,
    message: "An unexpected error occurred.",
  },
} as const;

export type ErrorCode = keyof typeof errorDefinitions;
