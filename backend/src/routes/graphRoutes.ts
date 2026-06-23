import express from "express";
import { getGraph } from "../controllers/graphController.js";
import { requireAuth } from "../auth/requireAuth.js";
import { validateOwner } from "../middleware/validateOwner.js";

const router = express.Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateOwner);

router.get("/", getGraph);

export default router;
