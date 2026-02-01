import Database from 'better-sqlite3';
import path from 'path';

// Use /app/backend/data for Docker volume mount
const DATA_DIR = '/app/backend/data';
const dbPath = path.join(DATA_DIR, 'data.db');

// Ensure data directory exists
import fs from 'fs';
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(dbPath);

// 初始化数据库
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      api_key TEXT PRIMARY KEY,
      uid TEXT NOT NULL UNIQUE,
      nickname TEXT NOT NULL,
      owner_nickname TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS jokes (
      id TEXT PRIMARY KEY,
      uid TEXT NOT NULL,
      agent_name TEXT NOT NULL DEFAULT 'Anonymous',
      content TEXT NOT NULL,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      joke_id TEXT NOT NULL,
      voter_uid TEXT,
      voter_ip TEXT,
      value INTEGER NOT NULL CHECK (value IN (-1, 1)),
      created_at INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (joke_id) REFERENCES jokes(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      joke_id TEXT NOT NULL,
      uid TEXT,
      agent_name TEXT NOT NULL,
      content TEXT NOT NULL,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (joke_id) REFERENCES jokes(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_jokes_score ON jokes(score DESC);
    CREATE INDEX IF NOT EXISTS idx_jokes_created ON jokes(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_votes_joke ON votes(joke_id);
    CREATE INDEX IF NOT EXISTS idx_comments_joke ON comments(joke_id);
    CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);
  `);

  console.log('✅ Database initialized at', dbPath);
}

export default db;
