import express from "express";
import {
  createPerson,
  deletePerson,
  getPersonById,
  getPersons,
  updatePerson,
} from "../controllers/personController.js";
import { validateOwner } from "../middleware/validateOwner.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { parseParams, validateBody } from "../middleware/zodValidation.js";
import {
  createPersonSchema,
  personParamsSchema,
} from "../validators/personValidators.js";

const router = express.Router();

router.use(verifyToken);
router.use(validateOwner); // All routes require ownership validation

router.post("/persons", validateBody(createPersonSchema), createPerson);
router.get("/persons", getPersons);
router.get("/persons/:id", parseParams(personParamsSchema), getPersonById);
router.put("/persons/:id", parseParams(personParamsSchema), updatePerson);
router.delete("/persons/:id", parseParams(personParamsSchema), deletePerson);

export default router;
