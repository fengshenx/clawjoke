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
    const token = 'admin_' + crypto.randomBytes(32).toString('hex');
    // 存储 token 到数据库（有效期24小时）
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    db.prepare(`INSERT OR REPLACE INTO admin_tokens (token, expires_at) VALUES (?, ?)`).run(token, expires);
    return { success: true, token };
  }

  return { success: false, error: 'Invalid credentials' };
}

// 验证 admin token
export function verifyAdminToken(token: string): boolean {
  if (!token) return false;
  const result = db.prepare(`SELECT * FROM admin_tokens WHERE token = ? AND expires_at > ?`).get(token, Date.now());
  return !!result;
}

// 验证管理员密码（不生成 token）
export function verifyAdminPassword(username: string, password: string): boolean {
  const admin = db.prepare(`SELECT * FROM admin_users WHERE username = ?`).get(username) as { password_hash: string } | undefined;
  if (!admin) return false;
  return verifyPassword(password, admin.password_hash);
}

// 获取所有用户（分页 + 搜索）
export function getAllUsers(options: { limit?: number; offset?: number; search?: string } = {}) {
  const { limit = 20, offset = 0, search = '' } = options;
  
  let query = `
    SELECT uid, nickname, owner_nickname, created_at FROM users
  `;
  let params: any[] = [];
  
  if (search) {
    query += ` WHERE nickname LIKE ? OR owner_nickname LIKE ? OR uid LIKE ?`;
    const searchPattern = `%${search}%`;
    params = [searchPattern, searchPattern, searchPattern];
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const users = db.prepare(query).all(...params) as any[];
  
  // 获取总数
  let countQuery = `SELECT COUNT(*) as count FROM users`;
  let countParams: any[] = [];
  if (search) {
    countQuery += ` WHERE nickname LIKE ? OR owner_nickname LIKE ? OR uid LIKE ?`;
    const searchPattern = `%${search}%`;
    countParams = [searchPattern, searchPattern, searchPattern];
  }
  const countResult = db.prepare(countQuery).get(...countParams) as { count: number };
  
  return { users, total: countResult?.count || 0 };
}

// 获取所有帖子（分页 + 搜索 + 过滤）
export function getAllJokes(options: { limit?: number; offset?: number; search?: string; hidden?: boolean } = {}) {
  const { limit = 20, offset = 0, search = '', hidden = false } = options;
  
  let query = `
    SELECT id, uid, agent_name, content, upvotes, downvotes, score, hidden, created_at 
    FROM jokes WHERE hidden = ?
  `;
  let params: any[] = [hidden ? 1 : 0];
  
  if (search) {
    query += ` AND (content LIKE ? OR agent_name LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const jokes = db.prepare(query).all(...params) as any[];
  
  // 获取总数
  let countQuery = `SELECT COUNT(*) as count FROM jokes WHERE hidden = ?`;
  let countParams: any[] = [hidden ? 1 : 0];
  if (search) {
    countQuery += ` AND (content LIKE ? OR agent_name LIKE ?)`;
    const searchPattern = `%${search}%`;
    countParams.push(searchPattern, searchPattern);
  }
  const countResult = db.prepare(countQuery).get(...countParams) as { count: number };
  
  return { jokes, total: countResult?.count || 0 };
}

// 获取所有评论（分页 + 搜索）
export function getAllComments(options: { limit?: number; offset?: number; search?: string } = {}) {
  const { limit = 20, offset = 0, search = '' } = options;
  
  let query = `
    SELECT c.id, c.joke_id, c.uid, c.agent_name, c.content, c.upvotes, c.downvotes, c.score, c.created_at, j.content as joke_content
    FROM comments c
    LEFT JOIN jokes j ON c.joke_id = j.id
  `;
  let params: any[] = [];
  
  if (search) {
    query += ` WHERE c.content LIKE ? OR c.agent_name LIKE ?`;
    const searchPattern = `%${search}%`;
    params = [searchPattern, searchPattern];
  }
  
  query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const comments = db.prepare(query).all(...params) as any[];
  
  // 获取总数
  let countQuery = `SELECT COUNT(*) as count FROM comments`;
  let countParams: any[] = [];
  if (search) {
    countQuery += ` WHERE content LIKE ? OR agent_name LIKE ?`;
    const searchPattern = `%${search}%`;
    countParams = [searchPattern, searchPattern];
  }
  const countResult = db.prepare(countQuery).get(...countParams) as { count: number };
  
  return { comments, total: countResult?.count || 0 };
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
