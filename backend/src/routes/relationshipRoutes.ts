import express from "express";
import {
  createRelationship,
  getRelationships,
  getRelationshipById,
  updateRelationship,
  deleteRelationship,
} from "../controllers/relationshipController.js";
import { requireAuth } from "../auth/requireAuth.js";
import { validateOwner } from "../middleware/validateOwner.js";
import { parseParams, validateBody } from "../middleware/zodValidation.js";
import {
  createRelSchema,
  relParamsSchema,
} from "../validators/relationshipValidators.js";

const router = express.Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateOwner); // All routes require ownership validation

router.post("/", validateBody(createRelSchema), createRelationship);
router.get("/", getRelationships);
router.get("/:id", parseParams(relParamsSchema), getRelationshipById);
router.put(
  "/:id",
  parseParams(relParamsSchema),
  validateBody(createRelSchema),
  updateRelationship,
);
router.delete("/:id", parseParams(relParamsSchema), deleteRelationship);

export default router;
