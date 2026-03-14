import express from "express";
import {
  createPerson,
  deletePerson,
  getPersonById,
  getPersons,
  updatePerson,
} from "../controllers/personController.js";

const router = express.Router();

router.post("/trees/:treeId/persons", createPerson);
router.get("/trees/:treeId/persons", getPersons);

router.get("/persons/:id", getPersonById);
router.put("/persons/:id", updatePerson);
router.delete("/persons/:id", deletePerson);

export default router;
