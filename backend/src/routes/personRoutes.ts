import express from "express";
import {
  createPerson,
  deletePerson,
  getPersonById,
  getPersons,
  updatePerson,
} from "../controllers/personController.js";
import { validateOwner } from "../middleware/validateOwner.js";
import { requireAuth } from "../auth/requireAuth.js";
import { parseParams, validateBody } from "../middleware/zodValidation.js";
import {
  createPersonSchema,
  personParamsSchema,
} from "../validators/personValidators.js";

const router = express.Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateOwner); // All routes require ownership validation

router.post("/", validateBody(createPersonSchema), createPerson);
router.get("/", getPersons);
router.get("/:id", parseParams(personParamsSchema), getPersonById);
router.put(
  "/:id",
  parseParams(personParamsSchema),
  validateBody(createPersonSchema),
  updatePerson,
);
router.delete("/:id", parseParams(personParamsSchema), deletePerson);

export default router;
