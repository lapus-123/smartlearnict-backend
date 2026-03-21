require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
connectDB();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/colleges", require("./routes/colleges"));
app.use("/api/sections", require("./routes/sections"));
app.use("/api/resources", require("./routes/resources"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/subjects", require("./routes/subjects"));
app.use("/api/materials", require("./routes/materials"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/progress", require("./routes/progress"));

app.get("/", (req, res) =>
  res.json({ message: "SmartLearningICT API is running." }),
);
app.get("/ping", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

// Global error handler — catches multer + cloudinary errors
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(400)
      .json({ message: "File too large. Maximum size is 100MB." });
  }
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server error." });
});

app.use((req, res) => res.status(404).json({ message: "Route not found." }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
