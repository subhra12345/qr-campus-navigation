const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();

// ✅ IMPORTANT FOR DEPLOYMENT (Render / Cloud)
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// ===== DATABASE =====
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("❌ Database error:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

// ===== CREATE TABLES =====

// Session table (Start & End points)
db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_point TEXT NOT NULL,
    end_point TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Nodes table (QR scans)
db.run(`
  CREATE TABLE IF NOT EXISTS nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    qr_code TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ===== ROUTES =====

// Health check (optional, but useful)
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// 1️⃣ START SESSION (from index.html)
app.post("/start-session", (req, res) => {
  const { startPoint, endPoint } = req.body;

  if (!startPoint || !endPoint) {
    return res.status(400).json({ message: "Start & End points required" });
  }

  db.run(
    "INSERT INTO sessions (start_point, end_point) VALUES (?, ?)",
    [startPoint, endPoint],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      // Send session ID back to frontend
      res.json({ sessionId: this.lastID });
    }
  );
});

// 2️⃣ ADD NODE (from record.html)
app.post("/add-node", (req, res) => {
  const { sessionId, qrCode } = req.body;

  if (!sessionId || !qrCode) {
    return res.status(400).json({ message: "Session ID & QR code required" });
  }

  db.run(
    "INSERT INTO nodes (session_id, qr_code) VALUES (?, ?)",
    [sessionId, qrCode],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({ success: true });
    }
  );
});

// ===== FRONTEND FALLBACK =====
// This ensures direct URL access works on Render
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
