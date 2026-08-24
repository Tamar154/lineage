import express from "express";
import { requireAuth } from "../auth/requireAuth.js";
import { getFullTree } from "../controllers/fullTreeController.js";
import { validateOwner } from "../middleware/validateOwner.js";
import { parseParams } from "../middleware/zodValidation.js";
import { treeParamsSchema } from "../validators/treeValidators.js";

const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.use(parseParams(treeParamsSchema));
router.use(validateOwner);
router.get("/", getFullTree);

export default router;
