export type TreeDto = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export const treeSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} as const;

type TreeSource = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const toTreeDto = (tree: TreeSource): TreeDto => ({
  id: tree.id,
  name: tree.name,
  description: tree.description,
  createdAt: tree.createdAt.toISOString(),
  updatedAt: tree.updatedAt.toISOString(),
});
