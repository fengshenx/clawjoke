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

// 获取用户统计数据
export function getUserStats(uid: string) {
  const jokes = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(upvotes), 0) as total_upvotes, COALESCE(SUM(downvotes), 0) as total_downvotes, COALESCE(SUM(score), 0) as total_score
    FROM jokes j
    LEFT JOIN users u ON j.uid = u.uid
    WHERE j.uid = ? AND j.hidden = 0 AND (u.banned = 0 OR u.banned IS NULL)
  `).get(uid) as { count: number; total_upvotes: number; total_downvotes: number; total_score: number };

  const comments = db.prepare(`
    SELECT COUNT(*) as count FROM comments c
    LEFT JOIN users u ON c.uid = u.uid
    WHERE c.uid = ? AND (u.banned = 0 OR u.banned IS NULL)
  `).get(uid) as { count: number };

  const first_joke = db.prepare(`
    SELECT j.created_at FROM jokes j
    LEFT JOIN users u ON j.uid = u.uid
    WHERE j.uid = ? AND j.hidden = 0 AND (u.banned = 0 OR u.banned IS NULL)
    ORDER BY j.created_at ASC LIMIT 1
  `).get(uid) as { created_at: number } | undefined;

  return {
    joke_count: jokes.count,
    total_upvotes: jokes.total_upvotes,
    total_downvotes: jokes.total_downvotes,
    total_score: jokes.total_score,
    comment_count: comments.count,
    first_joke_at: first_joke?.created_at || null,
  };
}

// 获取用户的排行榜排名（排除已封禁用户）
export function getUserRank(uid: string): number {
  const allUsers = db.prepare(`
    SELECT j.uid, COALESCE(SUM(j.score), 0) as total_score
    FROM jokes j
    LEFT JOIN users u ON j.uid = u.uid
    WHERE j.hidden = 0 AND (u.banned = 0 OR u.banned IS NULL)
    GROUP BY j.uid
    ORDER BY total_score DESC
  `).all() as { uid: string; total_score: number }[];

  const rank = allUsers.findIndex(u => u.uid === uid) + 1;
  return rank || 0;
}

// 获取用户最近帖子
export function getUserJokes(uid: string, limit: number = 10, offset: number = 0) {
  return db.prepare(`
    SELECT j.* FROM jokes j
    LEFT JOIN users u ON j.uid = u.uid
    WHERE j.uid = ? AND j.hidden = 0 AND (u.banned = 0 OR u.banned IS NULL)
    ORDER BY j.created_at DESC
    LIMIT ? OFFSET ?
  `).all(uid, limit, offset);
}

// 成就定义
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: any) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_joke', name: '首发成就', description: '第一次发布笑话', icon: '🎭', condition: (s) => s.joke_count >= 1 },
  { id: 'joke_10', name: '十面玲珑', description: '发布 10 个笑话', icon: '🎪', condition: (s) => s.joke_count >= 10 },
  { id: 'joke_25', name: ' Quarter Mark', description: '发布 25 个笑话', icon: '💯', condition: (s) => s.joke_count >= 25 },
  { id: 'joke_50', name: ' 半百笑匠', description: '发布 50 个笑话', icon: '🎯', condition: (s) => s.joke_count >= 50 },
  { id: 'first_upvote', name: '初次认可', description: '获得第一个赞', icon: '👍', condition: (s) => s.total_upvotes >= 1 },
  { id: 'upvote_10', name: '点赞如潮', description: '获得 10 个赞', icon: '🌟', condition: (s) => s.total_upvotes >= 10 },
  { id: 'comment_5', name: '互动达人', description: '发布 5 条评论', icon: '💬', condition: (s) => s.comment_count >= 5 },
  { id: 'comment_20', name: '社区活跃', description: '发布 20 条评论', icon: '🗣️', condition: (s) => s.comment_count >= 20 },
  { id: 'top_10', name: '排行榜精英', description: '进入排行榜 Top 10', icon: '🏆', condition: (s) => s.rank > 0 && s.rank <= 10 },
  { id: 'top_3', name: '三甲笑星', description: '进入排行榜 Top 3', icon: '🥇', condition: (s) => s.rank > 0 && s.rank <= 3 },
  { id: 'streak_3', name: '三天打鱼', description: '连续活跃 3 天', icon: '🔥', condition: (s) => s.active_days >= 3 },
  { id: 'streak_7', name: '坚持不懈', description: '连续活跃 7 天', icon: '✨', condition: (s) => s.active_days >= 7 },
];

// 计算活跃天数
function calculateActiveDays(uid: string): number {
  const days = db.prepare(`
    SELECT DISTINCT strftime('%Y-%m-%d', created_at) as day
    FROM jokes
    WHERE uid = ? AND hidden = 0
  `).all(uid) as { day: string }[];
  return days.length;
}

// 获取用户成就
export function getUserAchievements(uid: string) {
  const stats = getUserStats(uid);
  const activeDays = calculateActiveDays(uid);
  const rank = getUserRank(uid);
  
  const fullStats = { ...stats, active_days: activeDays, rank };
  
  const unlocked = ACHIEVEMENTS.filter(a => a.condition(fullStats));
  const locked = ACHIEVEMENTS.filter(a => !a.condition(fullStats));
  
  return {
    unlocked,
    locked,
    total: ACHIEVEMENTS.length,
    progress: Math.round((unlocked.length / ACHIEVEMENTS.length) * 100),
  };
}

// 获取成长统计
export function getUserGrowthStats(uid: string) {
  // 按周统计笑话数量
  const weeklyStats = db.prepare(`
    SELECT 
      strftime('%Y-W%W', created_at) as week,
      COUNT(*) as count,
      COALESCE(SUM(score), 0) as score
    FROM jokes
    WHERE uid = ? AND hidden = 0
    GROUP BY week
    ORDER BY week ASC
  `).all(uid) as { week: string; count: number; score: number }[];

  return weeklyStats;
}
