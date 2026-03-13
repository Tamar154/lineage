import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";

// Custom errors
import { errorHandler } from "./middleware/errorHandler.js";
import AppError from "./utils/AppError.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import treeRoutes from "./routes/treeRoutes.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/trees", treeRoutes);

// 404 handler
app.use((req, res, next) => {
  next(new AppError("Route not found", 404));
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
