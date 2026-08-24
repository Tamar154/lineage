import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";

import { auth } from "./auth/auth.js";
import loggerMiddleware from "./middleware/loggerMiddleware.js";

// Custom errors
import { errorHandler } from "./middleware/errorHandler.js";
import AppError from "./utils/AppError.js";

// Import routes
import treeRoutes from "./routes/treeRoutes.js";
import personRoutes from "./routes/personRoutes.js";
import relationshipRoutes from "./routes/relationshipRoutes.js";
import fullTreeRoutes from "./routes/fullTreeRoutes.js";

export const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use(cookieParser());
app.use(loggerMiddleware);

// Routes
app.use("/api/trees", treeRoutes);
app.use("/api/trees/:treeId/people", personRoutes);
app.use("/api/trees/:treeId/relationships", relationshipRoutes);
app.use("/api/trees/:treeId/full", fullTreeRoutes);

// 404 handler
app.use((req, res, next) => {
  next(new AppError("NOT_FOUND", { message: "Route not found." }));
});

// Centralized error handler
app.use(errorHandler);
