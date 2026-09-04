import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "polaroidwall",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

let isInitialized = false;

async function ensureTables() {
  if (isInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        team_name VARCHAR(100) NOT NULL,
        member1_name VARCHAR(100) NOT NULL,
        member1_student_id VARCHAR(20) NOT NULL,
        member2_name VARCHAR(100) DEFAULT '',
        member2_student_id VARCHAR(20) DEFAULT '',
        message TEXT DEFAULT '',
        photo_url VARCHAR(500) DEFAULT '',
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS card_likes (
        id SERIAL PRIMARY KEY,
        card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        visitor_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(card_id, visitor_id)
      );

      CREATE INDEX IF NOT EXISTS idx_card_likes_card_id ON card_likes(card_id);
      CREATE INDEX IF NOT EXISTS idx_card_likes_visitor ON card_likes(visitor_id);

      DO $$
      BEGIN
        ALTER TABLE cards ALTER COLUMN member2_name DROP NOT NULL;
        ALTER TABLE cards ALTER COLUMN member2_student_id DROP NOT NULL;
        ALTER TABLE cards ALTER COLUMN member2_name SET DEFAULT '';
        ALTER TABLE cards ALTER COLUMN member2_student_id SET DEFAULT '';
      EXCEPTION
        WHEN undefined_column THEN NULL;
        WHEN others THEN NULL;
      END $$;
    `);
    isInitialized = true;
  } catch (err) {
    console.error("Database table initialization error:", err);
  }
}

export async function query(text, params) {
  if (!isInitialized) {
    await ensureTables();
  }
  const result = await pool.query(text, params);
  return result;
}

export default pool;
