import express from "express";
import {
  createRelationship,
  deleteRelationship,
} from "../controllers/relationshipController.js";
import { requireAuth } from "../auth/requireAuth.js";
import { validateOwner } from "../middleware/validateOwner.js";
import { parseParams, validateBody } from "../middleware/zodValidation.js";
import {
  createRelSchema,
  relParamsSchema,
} from "../validators/relationshipValidators.js";
import { treeParamsSchema } from "../validators/treeValidators.js";

const router = express.Router({ mergeParams: true });

router.use(requireAuth);
router.use(parseParams(treeParamsSchema));
router.use(validateOwner); // All routes require ownership validation

router.post("/", validateBody(createRelSchema), createRelationship);
router.delete(
  "/:relationshipId",
  parseParams(relParamsSchema),
  deleteRelationship,
);

export default router;
