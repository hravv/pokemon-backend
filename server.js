const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.options("*", cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create per-Pokemon likes table
async function initializeDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pokemon_likes (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      likes INTEGER NOT NULL DEFAULT 0
    );
  `);
}

initializeDB();

// Get like count for one Pokémon
app.get("/likes/:name", async (req, res) => {
  const { name } = req.params;

  const result = await pool.query(
    "SELECT likes FROM pokemon_likes WHERE name = $1",
    [name]
  );

  if (result.rowCount === 0) {
    return res.json({ name, likes: 0 });
  }

  res.json({ name, likes: result.rows[0].likes });
});

// Create or increment a Pokémon's like count
app.post("/like", async (req, res) => {
  const { name } = req.body;

  await pool.query(`
    INSERT INTO pokemon_likes (name, likes)
    VALUES ($1, 1)
    ON CONFLICT (name)
    DO UPDATE SET likes = pokemon_likes.likes + 1
  `, [name]);

  const result = await pool.query(
    "SELECT likes FROM pokemon_likes WHERE name = $1",
    [name]
  );

  res.json({ name, likes: result.rows[0].likes });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));