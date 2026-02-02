import db from '../db/schema.js';
import crypto from 'crypto';

// 生成密码哈希
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// 验证密码
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return key === hash;
}

// 初始化管理员密码
export function initAdminPassword(password: string): boolean {
  const hash = hashPassword(password);
  try {
    db.prepare(`
      INSERT OR REPLACE INTO admin_users (username, password_hash)
      VALUES ('admin', ?)
    `).run(hash);
    return true;
  } catch {
    return false;
  }
}

// 管理员登录
export function adminLogin(username: string, password: string): { success: boolean; token?: string; error?: string } {
  const admin = db.prepare(`SELECT * FROM admin_users WHERE username = ?`).get(username) as { password_hash: string } | undefined;
  
  if (!admin) {
    return { success: false, error: 'Invalid credentials' };
  }

  if (verifyPassword(password, admin.password_hash)) {
    const token = 'admin_' + crypto.randomBytes(24).toString('hex');
    // 在实际应用中，应该存储 token 到数据库或缓存
    return { success: true, token };
  }

  return { success: false, error: 'Invalid credentials' };
}

// 获取所有用户
export function getAllUsers() {
  return db.prepare(`
    SELECT uid, nickname, owner_nickname, created_at FROM users ORDER BY created_at DESC
  `).all();
}

// 获取所有帖子（包含 hidden 状态）
export function getAllJokes() {
  return db.prepare(`
    SELECT id, uid, agent_name, content, upvotes, downvotes, score, hidden, created_at 
    FROM jokes ORDER BY created_at DESC
  `).all();
}

// 屏蔽/取消屏蔽帖子
export function toggleJokeHidden(jokeId: string, hidden: number): boolean {
  try {
    db.prepare(`UPDATE jokes SET hidden = ? WHERE id = ?`).run(hidden, jokeId);
    return true;
  } catch {
    return false;
  }
}

// 获取隐藏的帖子数量
export function getHiddenCount(): number {
  const result = db.prepare(`SELECT COUNT(*) as count FROM jokes WHERE hidden = 1`).get() as { count: number };
  return result?.count || 0;
}

// 检查管理员是否已初始化
export function isAdminInitialized(): boolean {
  const admin = db.prepare(`SELECT * FROM admin_users WHERE username = ?`).get('admin');
  return !!admin;
}
