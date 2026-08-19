CREATE TABLE IF NOT EXISTS cards (
  id SERIAL PRIMARY KEY,
  team_name VARCHAR(100) NOT NULL,
  member1_name VARCHAR(100) NOT NULL,
  member1_student_id VARCHAR(20) NOT NULL,
  member2_name VARCHAR(100) NOT NULL,
  member2_student_id VARCHAR(20) NOT NULL,
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
