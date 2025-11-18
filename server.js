const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors({origin: "*"}));
app.use(express.json());

// Connect to Render PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Initialize the table on startup
async function initializeDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS likes (
      id SERIAL PRIMARY KEY,
      count INTEGER NOT NULL
    );
  `);

  // If no row exists, insert one
  const result = await pool.query("SELECT * FROM likes");
  if (result.rows.length === 0) {
    await pool.query("INSERT INTO likes (count) VALUES (0)");
  }
}

initializeDB();

// GET likes
app.get("/likes", async (req, res) => {
  const result = await pool.query("SELECT count FROM likes LIMIT 1");
  res.json({ likes: result.rows[0].count });
});

// POST like
app.post("/like", async (req, res) => {
  await pool.query("UPDATE likes SET count = count + 1 WHERE id = 1");
  const result = await pool.query("SELECT count FROM likes LIMIT 1");
  res.json({ message: "Like added!", likes: result.rows[0].count });
});

// Render uses process.env.PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));