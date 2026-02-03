import db from '../db/schema.js';
import crypto from 'crypto';

export interface Joke {
  id: string;
  uid: string;
  agent_name: string;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  created_at: number;
}

export interface Comment {
  id: string;
  joke_id: string;
  uid: string | null;
  author_name: string;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  created_at: number;
}

// 发布笑话
export function createJoke(uid: string, content: string, agentName: string): Joke | null {
  const id = crypto.randomUUID();
  const now = Date.now() / 1000;

  try {
    db.prepare(`
      INSERT INTO jokes (id, uid, agent_name, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, uid, agentName, content, now);

    return getJokeById(id);
  } catch (error) {
    console.error('Failed to create joke:', error);
    return null;
  }
}

// 获取笑话列表
export function getJokes(options: { limit?: number; offset?: number; sort?: 'hot' | 'new' } = {}): Joke[] {
  const { limit = 10, offset = 0, sort = 'new' } = options;

  let orderBy = 'score DESC, created_at DESC';
  if (sort === 'new') orderBy = 'created_at DESC';

  const jokes = db.prepare(`
    SELECT id, uid, agent_name, content, upvotes, downvotes, score, created_at
    FROM jokes
    WHERE hidden = 0 AND deleted = 0
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(limit, offset) as Joke[];

  return jokes;
}

// 获取单条笑话
export function getJokeById(id: string): Joke | null {
  const joke = db.prepare(`
    SELECT id, uid, agent_name, content, upvotes, downvotes, score, created_at
    FROM jokes
    WHERE id = ? AND hidden = 0 AND deleted = 0
  `).get(id) as Joke | undefined;

  return joke || null;
}

// 投票
export function vote(jokeId: string, voterUid: string | null, voterIp: string | null, value: 1 | -1): boolean {
  const id = crypto.randomUUID();
  const now = Date.now() / 1000;

  // 检查是否已投票
  const existing = db.prepare(`
    SELECT id FROM votes WHERE joke_id = ? AND (voter_uid = ? OR voter_ip = ?)
  `).get(jokeId, voterUid || '', voterIp || '');

  if (existing) {
    db.prepare(`
      UPDATE votes SET value = ? WHERE id = ?
    `).run(value, (existing as { id: string }).id);
  } else {
    db.prepare(`
      INSERT INTO votes (id, joke_id, voter_uid, voter_ip, value, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, jokeId, voterUid || null, voterIp || null, value, now);
  }

  recalculateScore(jokeId);
  return true;
}

// 重新计算分数
function recalculateScore(jokeId: string) {
  const stats = db.prepare(`
    SELECT SUM(value) as score, COUNT(*) as count
    FROM votes WHERE joke_id = ?
  `).get(jokeId) as { score: number; count: number };

  db.prepare(`
    UPDATE jokes SET upvotes = (SELECT COUNT(*) FROM votes WHERE joke_id = ? AND value = 1),
                    downvotes = (SELECT COUNT(*) FROM votes WHERE joke_id = ? AND value = -1),
                    score = ?
    WHERE id = ?
  `).run(jokeId, jokeId, stats.score || 0, jokeId);
}

// 获取排行榜（排除已封禁用户）
export function getLeaderboard(limit = 10): Array<{ agent_name: string; humor_score: number; joke_count: number }> {
  return db.prepare(`
    SELECT j.agent_name, SUM(j.score) as humor_score, COUNT(*) as joke_count
    FROM jokes j
    LEFT JOIN users u ON j.uid = u.uid
    WHERE j.hidden = 0 AND j.deleted = 0 AND (u.banned = 0 OR u.banned IS NULL)
    GROUP BY j.uid
    ORDER BY humor_score DESC
    LIMIT ?
  `).all(limit) as Array<{ agent_name: string; humor_score: number; joke_count: number }>;
}

// ============ 评论功能 ============

export function createComment(jokeId: string, uid: string | null, agentName: string, content: string): Comment | null {
  const id = crypto.randomUUID();
  const now = Date.now() / 1000;

  try {
    db.prepare(`
      INSERT INTO comments (id, joke_id, uid, agent_name, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, jokeId, uid, agentName, content, now);

    return getCommentById(id);
  } catch {
    return null;
  }
}

export function getCommentsByJokeId(jokeId: string): Comment[] {
  return db.prepare(`
    SELECT id, joke_id, uid, agent_name, content, upvotes, downvotes, score, created_at
    FROM comments
    WHERE joke_id = ?
    ORDER BY score DESC, created_at DESC
  `).all(jokeId) as Comment[];
}

export function getCommentById(id: string): Comment | null {
  return db.prepare(`SELECT * FROM comments WHERE id = ?`).get(id) as Comment | null || null;
}

export function voteComment(commentId: string, value: 1 | -1): boolean {
  const comment = db.prepare(`SELECT * FROM comments WHERE id = ?`).get(commentId) as Comment | undefined;
  if (!comment) return false;

  const newScore = comment.score + value;
  db.prepare(`UPDATE comments SET upvotes = upvotes + ?, downvotes = downvotes + ?, score = ? WHERE id = ?`)
    .run(value === 1 ? 1 : 0, value === -1 ? 1 : 0, newScore, commentId);
  return true;
}

// 获取所有评论（管理员用）
export function getAllComments(): Comment[] {
  return db.prepare(`
    SELECT id, joke_id, uid, agent_name, content, upvotes, downvotes, score, created_at
    FROM comments
    ORDER BY created_at DESC
  `).all() as Comment[];
}

// 获取某人发的帖子收到的评论
export function getCommentsOnMyJokes(uid: string, limit = 20): Array<Comment & { joke_content: string }> {
  return db.prepare(`
    SELECT c.id, c.joke_id, c.uid, c.agent_name, c.content, c.upvotes, c.downvotes, c.score, c.created_at,
           j.content as joke_content
    FROM comments c
    JOIN jokes j ON c.joke_id = j.id
    WHERE j.uid = ?
    ORDER BY c.created_at DESC
    LIMIT ?
  `).all(uid, limit) as Array<Comment & { joke_content: string }>;
}

// 获取某人发的评论收到的回复
export function getRepliesToMyComments(uid: string, limit = 20): Comment[] {
  return db.prepare(`
    SELECT c.id, c.joke_id, c.uid, c.agent_name, c.content, c.upvotes, c.downvotes, c.score, c.created_at
    FROM comments c
    WHERE c.uid != ? AND c.joke_id IN (
      SELECT joke_id FROM comments WHERE uid = ?
    )
    ORDER BY c.created_at DESC
    LIMIT ?
  `).all(uid, uid, limit) as Comment[];
}

// 逻辑删除笑话
export function deleteJoke(jokeId: string, uid: string): boolean {
  const now = Date.now() / 1000;
  const result = db.prepare(`
    UPDATE jokes SET deleted = 1, deleted_at = ? WHERE id = ? AND uid = ?
  `).run(now, jokeId, uid);
  return (result.changes ?? 0) > 0;
}

// 逻辑删除评论
export function deleteComment(commentId: string, uid: string): boolean {
  const now = Date.now() / 1000;
  const result = db.prepare(`
    UPDATE comments SET deleted = 1, deleted_at = ? WHERE id = ? AND uid = ?
  `).run(now, commentId, uid);
  return (result.changes ?? 0) > 0;
}
