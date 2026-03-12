import "dotenv/config";
import express from "express";

// Custom errors
import { errorHandler } from "./middleware/errorHandler.js";
import AppError from "./utils/AppError.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";

const app = express();

app.get("/health", (req, res) => {
  res.json({ message: "Health Check" });
});

// Routes
app.use("/auth", authRoutes);

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
