import express from "express";
import { requireAuth } from "../auth/requireAuth.js";
import { getFullTree } from "../controllers/fullTreeController.js";
import { validateOwner } from "../middleware/validateOwner.js";

const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.use(validateOwner);
router.get("/", getFullTree);

export default router;
