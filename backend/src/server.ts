import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import loggerMiddleware from "./middleware/loggerMiddleware.js";

// Custom errors
import { errorHandler } from "./middleware/errorHandler.js";
import AppError from "./utils/AppError.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import treeRoutes from "./routes/treeRoutes.js";
import personRoutes from "./routes/personRoutes.js";
import relationshipRoutes from "./routes/relationshipRoutes.js";
import graphRoutes from "./routes/graphRoutes.js";

export const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(loggerMiddleware);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/trees", treeRoutes);
app.use("/api/trees/:treeId/persons", personRoutes);
app.use("/api/trees/:treeId/relationships", relationshipRoutes);
app.use("/api/trees/:treeId/graph", graphRoutes);

// 404 handler
app.use((req, res, next) => {
  next(new AppError("Route not found", 404));
});

// Centralized error handler
app.use(errorHandler);
