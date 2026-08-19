import express from "express";
import {
  createPerson,
  deletePerson,
  updatePerson,
} from "../controllers/personController.js";
import { validateOwner } from "../middleware/validateOwner.js";
import { requireAuth } from "../auth/requireAuth.js";
import { parseParams, validateBody } from "../middleware/zodValidation.js";
import {
  createPersonSchema,
  personParamsSchema,
  updatePersonSchema,
} from "../validators/personValidators.js";

const router = express.Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateOwner); // All routes require ownership validation

router.post("/", validateBody(createPersonSchema), createPerson);
router.patch(
  "/:personId",
  parseParams(personParamsSchema),
  validateBody(updatePersonSchema),
  updatePerson,
);
router.delete("/:personId", parseParams(personParamsSchema), deletePerson);

export default router;
