import express from "express";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "",
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "",
  port: process.env.DB_PORT || 5432,
});

const waitForDB = async (retries = 10, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query("SELECT 1");
      console.log("✅ Postgres is ready!");
      return;
    } catch (err) {
      console.log(`⏳ Waiting for Postgres... (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("❌ Postgres not ready after retries");
};

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      pol_id VARCHAR(255) NOT NULL,
      handle VARCHAR(255) NOT NULL,
      sq_acc VARCHAR(255) NOT NULL,
      two_fa BOOLEAN NOT NULL
    )
  `);
  console.log("✅ Table 'users' is ready!");
};

const startServer = async () => {
  try {
    await waitForDB(20, 1000); 
    await initDB();

    app.get("/api/entries", async (req, res) => {
      const { rows } = await pool.query("SELECT * FROM users ORDER BY id ASC");
      res.json(rows);
    });

    app.post("/api/entries", async (req, res) => {
      const { polId, handle, sqAcc, twoFA } = req.body;
      const { rows } = await pool.query(
        `INSERT INTO users (pol_id, handle, sq_acc, two_fa)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [polId, handle, sqAcc, twoFA]
      );
      res.json(rows[0]);
    });

    app.put("/api/entries/:id", async (req, res) => {
      const { id } = req.params;
      const { polId, handle, sqAcc, twoFA } = req.body;
      const { rows } = await pool.query(
        `UPDATE users SET pol_id=$1, handle=$2, sq_acc=$3, two_fa=$4
         WHERE id=$5 RETURNING *`,
        [polId, handle, sqAcc, twoFA, id]
      );
      res.json(rows[0]);
    });

    app.delete("/api/entries/:id", async (req, res) => {
      const { id } = req.params;
      const { rows } = await pool.query(
        "DELETE FROM users WHERE id=$1 RETURNING *",
        [id]
      );
      res.json(rows[0]);
    });

    const PORT = 3000;
    app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

startServer();
