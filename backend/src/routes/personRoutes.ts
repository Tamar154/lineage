import express from "express";
import {
  createPerson,
  deletePerson,
  getPersonById,
  getPersons,
  updatePerson,
} from "../controllers/personController.js";
import { validateOwner } from "../middleware/validateOwner.js";

const router = express.Router();

router.use(validateOwner); // All routes require ownership validation

router.post("/persons", createPerson);
router.get("/persons", getPersons);
router.get("/persons/:id", getPersonById);
router.put("/persons/:id", updatePerson);
router.delete("/persons/:id", deletePerson);

export default router;
