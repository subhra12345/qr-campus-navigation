const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Database
const db = new sqlite3.Database("./database.db");

// ===== CREATE TABLES =====

// Session table (Start + End)
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
  session_id INTEGER,
  qr_code TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

// ===== APIs =====

// 1️⃣ START SESSION (FROM FIRST SCREEN)
app.post("/start-session", (req, res) => {
  const { startPoint, endPoint } = req.body;

  if (!startPoint || !endPoint) {
    return res.status(400).json({ message: "Start & End required" });
  }

  db.run(
    "INSERT INTO sessions (start_point, end_point) VALUES (?, ?)",
    [startPoint, endPoint],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "DB Error" });
      }

      // SEND SESSION ID BACK
      res.json({ sessionId: this.lastID });
    }
  );
});

// 2️⃣ ADD NODE (FROM RECORD SCREEN)
app.post("/add-node", (req, res) => {
  const { sessionId, qrCode } = req.body;

  if (!sessionId || !qrCode) {
    return res.status(400).json({ message: "Session & QR required" });
  }

  db.run(
    "INSERT INTO nodes (session_id, qr_code) VALUES (?, ?)",
    [sessionId, qrCode],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "DB Error" });
      }

      res.json({ success: true });
    }
  );
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
