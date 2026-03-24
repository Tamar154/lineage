import express from "express";
import { getGraph } from "../controllers/graphController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { validateOwner } from "../middleware/validateOwner.js";

const router = express.Router({ mergeParams: true });

router.use(verifyToken);
router.use(validateOwner);

router.get("/", getGraph);

export default router;
