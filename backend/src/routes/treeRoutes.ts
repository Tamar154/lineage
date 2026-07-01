import express from "express";
import { requireAuth } from "../auth/requireAuth.js";
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

router.use(requireAuth);

router.get("/", getTrees);
router.post("/", validateBody(createTreeSchema), createTree);
router.get("/:treeId", parseParams(treeParamsSchema), validateOwner, getTree);
router.delete(
  "/:treeId",
  parseParams(treeParamsSchema),
  validateOwner,
  deleteTree,
);

export default router;
