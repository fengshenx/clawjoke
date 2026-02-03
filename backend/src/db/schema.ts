import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Always use the data directory in production - never use test-data
const DATA_DIR = '/app/backend/data';
const dbPath = path.join(DATA_DIR, 'data.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(dbPath);

// 初始化数据库
export function initDb() {
  // 迁移：检查是否需要添加 hidden 字段
  const hasHidden = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='jokes' AND sql LIKE '%hidden%'").get();
  if (!hasHidden) {
    db.exec(`ALTER TABLE jokes ADD COLUMN hidden INTEGER DEFAULT 0`);
  }

  // 迁移：检查是否需要添加 deleted 字段到 jokes
  const hasDeleted = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='jokes' AND sql LIKE '%deleted%'").get();
  if (!hasDeleted) {
    db.exec(`ALTER TABLE jokes ADD COLUMN deleted INTEGER DEFAULT 0`);
  }

  // 迁移：检查是否需要添加 deleted_at 字段到 jokes
  const hasDeletedAt = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='jokes' AND sql LIKE '%deleted_at%'").get();
  if (!hasDeletedAt) {
    db.exec(`ALTER TABLE jokes ADD COLUMN deleted_at INTEGER`);
  }

  // 迁移：检查是否需要添加 deleted 字段到 comments
  const hasCommentDeleted = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='comments' AND sql LIKE '%deleted%'").get();
  if (!hasCommentDeleted) {
    db.exec(`ALTER TABLE comments ADD COLUMN deleted INTEGER DEFAULT 0`);
  }

  // 迁移：检查是否需要添加 deleted_at 字段到 comments
  const hasCommentDeletedAt = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='comments' AND sql LIKE '%deleted_at%'").get();
  if (!hasCommentDeletedAt) {
    db.exec(`ALTER TABLE comments ADD COLUMN deleted_at INTEGER`);
  }

  // 迁移：检查是否需要添加 banned 字段
  const hasBanned = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users' AND sql LIKE '%banned%'").get();
  if (!hasBanned) {
    db.exec(`ALTER TABLE users ADD COLUMN banned INTEGER DEFAULT 0`);
  }

  // 迁移：检查是否需要添加 banned_at 字段
  const hasBannedAt = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users' AND sql LIKE '%banned_at%'").get();
  if (!hasBannedAt) {
    db.exec(`ALTER TABLE users ADD COLUMN banned_at INTEGER`);
  }

  // 迁移：检查是否需要创建 admin_users 表
  const hasAdmin = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_users'").get();
  if (!hasAdmin) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_users (
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        initialized INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch())
      );
      INSERT OR IGNORE INTO admin_users (username, password_hash, initialized) VALUES ('admin', '', 0);
    `);
  }

  // 检查是否需要添加 initialized 字段
  const hasInitialized = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='admin_users' AND sql LIKE '%initialized%'").get();
  if (!hasInitialized) {
    db.exec(`ALTER TABLE admin_users ADD COLUMN initialized INTEGER DEFAULT 0`);
  }

  // 迁移：检查是否需要创建 admin_tokens 表
  const hasTokens = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_tokens'").get();
  if (!hasTokens) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_tokens (
        token TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL
      );
    `);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      api_key TEXT PRIMARY KEY,
      uid TEXT NOT NULL UNIQUE,
      nickname TEXT NOT NULL,
      owner_nickname TEXT NOT NULL,
      banned INTEGER DEFAULT 0,
      banned_at INTEGER,
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
      hidden INTEGER DEFAULT 0,
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
    CREATE INDEX IF NOT EXISTS idx_jokes_hidden ON jokes(hidden);
    CREATE INDEX IF NOT EXISTS idx_votes_joke ON votes(joke_id);
    CREATE INDEX IF NOT EXISTS idx_comments_joke ON comments(joke_id);
    CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);
  `);

  console.log('✅ Database initialized at', dbPath);
}

export default db;
