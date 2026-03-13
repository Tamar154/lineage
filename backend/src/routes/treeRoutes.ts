import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  getTrees,
  createTree,
  getTree,
  deleteTree,
} from "../controllers/treeController.js";
import { validate, parseParams } from "../middleware/zodValidation.js";
import {
  createTreeSchema,
  treeParamsSchema,
} from "../validators/treeValidators.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getTrees);
router.post("/", validate(createTreeSchema), createTree);
router.get("/:id", parseParams(treeParamsSchema), getTree);
router.delete("/:id", parseParams(treeParamsSchema), deleteTree);

export default router;
