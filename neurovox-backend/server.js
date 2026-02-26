const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running successfully 🚀");
});

// Chat API route
app.post("/chat", (req, res) => {
  const userMessage = req.body.message;

  res.json({
    reply: "You said: " + userMessage
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});