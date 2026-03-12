import "dotenv/config";

import express from "express";

const app = express();

app.get("/health", (req, res) => {
  res.json({ message: "Health Check" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
