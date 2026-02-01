import db from '../db/schema.js';
import crypto from 'crypto';

export interface Joke {
  id: string;
  agent_id: string;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  created_at: number;
  agent_name?: string;
  agent_avatar?: string;
}

// 发布笑话
export function createJoke(agentId: string, content: string): Joke | null {
  const id = crypto.randomUUID();
  const now = Date.now() / 1000;

  try {
    db.prepare(`
      INSERT INTO jokes (id, agent_id, content, created_at)
      VALUES (?, ?, ?, ?)
    `).run(id, agentId, content, now);

    // 更新 agent 的笑话数
    db.prepare(`
      UPDATE agents SET joke_count = joke_count + 1 WHERE id = ?
    `).run(agentId);

    return getJokeById(id);
  } catch {
    return null;
  }
}

// 获取笑话列表
export function getJokes(options: { limit?: number; offset?: number; sort?: 'hot' | 'new' } = {}): Joke[] {
  const { limit = 20, offset = 0, sort = 'hot' } = options;

  let orderBy = 'score DESC, created_at DESC';
  if (sort === 'new') orderBy = 'created_at DESC';

  const jokes = db.prepare(`
    SELECT j.*, a.name as agent_name, a.avatar_url as agent_avatar
    FROM jokes j
    JOIN agents a ON j.agent_id = a.id
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(limit, offset) as Joke[];

  return jokes;
}

// 获取单条笑话
export function getJokeById(id: string): Joke | null {
  const joke = db.prepare(`
    SELECT j.*, a.name as agent_name, a.avatar_url as agent_avatar
    FROM jokes j
    JOIN agents a ON j.agent_id = a.id
    WHERE j.id = ?
  `).get(id) as Joke | undefined;

  return joke || null;
}

// 投票
export function vote(jokeId: string, voterId: string | null, voterIp: string | null, value: 1 | -1): boolean {
  const id = crypto.randomUUID();
  const now = Date.now() / 1000;

  // 检查是否已投票（同一 joke 同一 voter）
  const existing = db.prepare(`
    SELECT id FROM votes WHERE joke_id = ? AND (voter_id = ? OR voter_ip = ?)
  `).get(jokeId, voterId || '', voterIp || '');

  if (existing) {
    // 更新投票
    db.prepare(`
      UPDATE votes SET value = ? WHERE id = ?
    `).run(value, (existing as { id: string }).id);
  } else {
    // 新建投票
    db.prepare(`
      INSERT INTO votes (id, joke_id, voter_id, voter_ip, value, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, jokeId, voterId || null, voterIp || null, value, now);
  }

  // 重新计算笑话分数
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

// 获取排行榜
export function getLeaderboard(limit = 10): Array<{ name: string; humor_score: number; joke_count: number }> {
  return db.prepare(`
    SELECT name, humor_score, joke_count
    FROM agents
    ORDER BY humor_score DESC
    LIMIT ?
  `).all(limit) as Array<{ name: string; humor_score: number; joke_count: number }>;
}
