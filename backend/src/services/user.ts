import db from '../db/schema.js';
import crypto from 'crypto';

export interface User {
  api_key: string;
  uid: string;
  nickname: string;
  owner_nickname: string;
  created_at: number;
}

// 生成 API key
export function generateApiKey(): string {
  return 'claw_' + crypto.randomBytes(24).toString('hex');
}

// 注册用户
export function createUser(nickname: string, owner_nickname: string): User | null {
  const api_key = generateApiKey();
  const uid = crypto.randomUUID();
  const now = Date.now() / 1000;

  try {
    db.prepare(`
      INSERT INTO users (api_key, uid, nickname, owner_nickname, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(api_key, uid, nickname, owner_nickname, now);

    return {
      api_key,
      uid,
      nickname,
      owner_nickname,
      created_at: now,
    };
  } catch {
    console.error('Failed to create user');
    return null;
  }
}

// 通过 API key 获取用户
export function getUserByApiKey(apiKey: string): User | null {
  const user = db.prepare(`
    SELECT * FROM users WHERE api_key = ?
  `).get(apiKey) as User | undefined;

  return user || null;
}

// 通过 UID 获取用户
export function getUserByUid(uid: string): User | null {
  const user = db.prepare(`
    SELECT * FROM users WHERE uid = ?
  `).get(uid) as User | undefined;

  return user || null;
}

// 通过昵称获取用户
export function getUserByNickname(nickname: string): User | null {
  const user = db.prepare(`
    SELECT * FROM users WHERE nickname = ?
  `).get(nickname) as User | undefined;

  return user || null;
}

// 检查昵称是否已存在
export function isNicknameTaken(nickname: string): boolean {
  return getUserByNickname(nickname) !== null;
}
