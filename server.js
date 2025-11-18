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

app.get("/top-liked", async (req, res) => {
  const result = await pool.query(`
    SELECT name, likes
    FROM pokemon_likes
    ORDER BY likes DESC
    LIMIT 5
  `);

  res.json(result.rows);
});

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


app.post("/unlike", async (req, res) => {
  const { name } = req.body;

  await pool.query(`
    UPDATE pokemon_likes
    SET likes = GREATEST(likes - 1, 0)
    WHERE name = $1
  `, [name]);

  const result = await pool.query(
    "SELECT likes FROM pokemon_likes WHERE name = $1",
    [name]
  );

  const currentLikes = result.rowCount === 0 ? 0 : result.rows[0].likes;

  res.json({ name, likes: currentLikes });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));