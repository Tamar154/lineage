import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  getTrees,
  createTree,
  getTree,
  deleteTree,
} from "../controllers/treeController.js";
import { validateBody, parseParams } from "../middleware/zodValidation.js";
import { validateOwner } from "../middleware/validateOwner.js";
import {
  createTreeSchema,
  treeParamsSchema,
} from "../validators/treeValidators.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getTrees);
router.post("/", validateBody(createTreeSchema), createTree);
router.get("/:id", parseParams(treeParamsSchema), validateOwner, getTree);
router.delete("/:id", parseParams(treeParamsSchema), validateOwner, deleteTree);

export default router;
