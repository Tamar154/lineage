import type { PersonDto } from "./personDto.js";
import type { RelationshipDto } from "./relationshipDto.js";
import type { TreeDto } from "./treeDto.js";

export type FullTreeDto = {
  tree: TreeDto;
  people: PersonDto[];
  relationships: RelationshipDto[];
};
