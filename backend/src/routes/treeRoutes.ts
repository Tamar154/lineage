import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { getTrees } from "../controllers/treeController.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getTrees);

export default router;
