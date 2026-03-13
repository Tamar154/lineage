import express from "express";
import { register, login, logout } from "../controllers/authController.js";
import { validate } from "../middleware/zodValidation.js";
import { loginSchema, registerSchema } from "../validators/authValidators.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);

export default router;
