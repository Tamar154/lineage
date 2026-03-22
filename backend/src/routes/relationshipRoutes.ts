import express from "express";
import {
  createRelationship,
  getRelationships,
  getRelationshipById,
  updateRelationship,
  deleteRelationship,
} from "../controllers/relationshipController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { validateOwner } from "../middleware/validateOwner.js";
import { validateBody } from "../middleware/zodValidation.js";
import { createRelSchema } from "../validators/relationshipValidators.js";

const router = express.Router({ mergeParams: true });

router.use(verifyToken);
router.use(validateOwner); // All routes require ownership validation

router.post("/", validateBody(createRelSchema), createRelationship);
router.get("/", getRelationships);
router.get("/:id", getRelationshipById);
router.put("/:id", updateRelationship);
router.delete("/:id", deleteRelationship);

export default router;
