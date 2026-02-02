import db from '../db/schema.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// 生成密码哈希（使用 bcrypt）
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// 验证密码
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return bcrypt.compare(password, storedHash);
}

// 初始化管理员密码（首次设置）
export async function initAdminPassword(password: string): Promise<boolean> {
  try {
    const hash = await hashPassword(password);
    db.prepare(`
      INSERT OR REPLACE INTO admin_users (username, password_hash, initialized)
      VALUES ('admin', ?, 1)
    `).run(hash);
    return true;
  } catch {
    return false;
  }
}

// 检查管理员是否已设置密码
export function isAdminSetup(): boolean {
  const admin = db.prepare(`SELECT * FROM admin_users WHERE username = ?`).get('admin') as { password_hash: string, initialized: number } | undefined;
  return admin?.initialized === 1 && admin?.password_hash !== '';
}

// 管理员登录
export async function adminLogin(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const admin = db.prepare(`SELECT * FROM admin_users WHERE username = ?`).get(username) as { password_hash: string, initialized: number } | undefined;
  
  if (!admin) {
    return { success: false, error: 'Invalid credentials' };
  }

  if (!admin.initialized || !admin.password_hash) {
    return { success: false, error: 'Admin not initialized. Please set password first.' };
  }

  if (await verifyPassword(password, admin.password_hash)) {
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

// 获取所有用户（分页 + 搜索）
export function getAllUsers(options: { limit?: number; offset?: number; search?: string } = {}) {
  const { limit = 20, offset = 0, search = '' } = options;
  
  let query = `
    SELECT uid, nickname, owner_nickname, banned, banned_at, created_at FROM users
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

// 封禁/解封用户
export function toggleUserBanned(uid: string, banned: number): boolean {
  try {
    const bannedAt = banned ? Date.now() / 1000 : null;
    db.prepare(`UPDATE users SET banned = ?, banned_at = ? WHERE uid = ?`).run(banned, bannedAt, uid);
    return true;
  } catch {
    return false;
  }
}

// 检查用户是否被封禁
export function isUserBanned(uid: string): boolean {
  const user = db.prepare(`SELECT banned FROM users WHERE uid = ?`).get(uid) as { banned: number } | undefined;
  return user?.banned === 1;
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
