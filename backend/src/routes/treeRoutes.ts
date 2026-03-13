import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  getTrees,
  createTree,
  getTree,
  deleteTree,
} from "../controllers/treeController.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getTrees);
router.post("/", createTree);
router.get("/:id", getTree);
router.delete("/:id", deleteTree);

export default router;
