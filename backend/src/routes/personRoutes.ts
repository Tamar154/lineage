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
import { parseParams } from "../middleware/zodValidation.js";
import { idParamsSchema } from "../validators/idParams.js";

const router = express.Router();

router.use(verifyToken);
router.use(validateOwner); // All routes require ownership validation
router.use(parseParams(idParamsSchema));

router.post("/persons", createPerson);
router.get("/persons", getPersons);
router.get("/persons/:id", getPersonById);
router.put("/persons/:id", updatePerson);
router.delete("/persons/:id", deletePerson);

export default router;
