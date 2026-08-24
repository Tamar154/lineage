import type { RequestHandler } from "express";
import { prisma } from "../config/db.js";
import type { ApiSuccess } from "../dtos/apiSuccess.js";
import type { FullTreeDto } from "../dtos/fullTreeDto.js";
import { personSelect, toPersonDto } from "../dtos/personDto.js";
import {
  relationshipSelect,
  toRelationshipDto,
} from "../dtos/relationshipDto.js";
import { toTreeDto, treeSelect } from "../dtos/treeDto.js";
import AppError from "../utils/AppError.js";

export const getFullTree: RequestHandler<
  { treeId: string },
  ApiSuccess<FullTreeDto>
> = async (req, res) => {
  const tree = await prisma.tree.findFirst({
    where: { id: req.tree.id, ownerId: req.user.id },
    select: {
      ...treeSelect,
      persons: { select: personSelect },
      relationships: { select: relationshipSelect },
    },
  });

  if (!tree) throw new AppError("NOT_FOUND");

  const { persons, relationships, ...treeFields } = tree;
  res.json({
    data: {
      tree: toTreeDto(treeFields),
      people: persons.map(toPersonDto),
      relationships: relationships.map(toRelationshipDto),
    },
  });
};
