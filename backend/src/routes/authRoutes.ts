import express from "express";
import { register, login, logout } from "../controllers/authController.js";
import { validateBody } from "../middleware/zodValidation.js";
import { loginSchema, registerSchema } from "../validators/authValidators.js";

const router = express.Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/logout", logout);

export default router;
