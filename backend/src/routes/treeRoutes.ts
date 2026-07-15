import express from "express";
import { requireAuth } from "../auth/requireAuth.js";
import {
  getTrees,
  createTree,
  getTree,
  updateTree,
  deleteTree,
} from "../controllers/treeController.js";
import { validateBody, parseParams } from "../middleware/zodValidation.js";
import { validateOwner } from "../middleware/validateOwner.js";
import {
  createTreeSchema,
  treeParamsSchema,
  updateTreeSchema,
} from "../validators/treeValidators.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getTrees);
router.post("/", validateBody(createTreeSchema), createTree);
router.get("/:treeId", parseParams(treeParamsSchema), validateOwner, getTree);
router.patch(
  "/:treeId",
  parseParams(treeParamsSchema),
  validateOwner,
  validateBody(updateTreeSchema),
  updateTree,
);
router.delete(
  "/:treeId",
  parseParams(treeParamsSchema),
  validateOwner,
  deleteTree,
);

export default router;
