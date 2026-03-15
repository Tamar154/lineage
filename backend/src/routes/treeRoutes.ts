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
import { createTreeSchema } from "../validators/treeValidators.js";
import { idParamsSchema } from "../validators/idParams.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getTrees);
router.post("/", validateBody(createTreeSchema), createTree);
router.get("/:id", parseParams(idParamsSchema), validateOwner, getTree);
router.delete("/:id", parseParams(idParamsSchema), validateOwner, deleteTree);

export default router;
