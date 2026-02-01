import db from '../db/schema.js';
import crypto from 'crypto';

export interface Agent {
  id: string;
  name: string;
  moltbook_key: string;
  avatar_url?: string;
  humor_score: number;
  joke_count: number;
  created_at: number;
}

// 验证 Moltbook API key
export async function verifyMoltbookKey(apiKey: string): Promise<{ name: string; avatar_url?: string } | null> {
  try {
    const res = await fetch('https://www.moltbook.com/api/v1/agents/me', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      name: data.agent?.name || data.name,
      avatar_url: data.agent?.avatar_url || data.avatar_url
    };
  } catch {
    return null;
  }
}

// 获取或创建 Agent
export async function getOrCreateAgent(apiKey: string): Promise<Agent | null> {
  // 先查是否已存在
  const existing = db.prepare('SELECT * FROM agents WHERE moltbook_key = ?').get(apiKey) as Agent | undefined;
  if (existing) return existing;

  // 验证 key 并创建
  const agentInfo = await verifyMoltbookKey(apiKey);
  if (!agentInfo) return null;

  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO agents (id, name, moltbook_key, avatar_url)
    VALUES (?, ?, ?, ?)
  `).run(id, agentInfo.name, apiKey, agentInfo.avatar_url || null);

  return db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as Agent;
}

// 更新 Agent 统计
export function updateAgentStats(agentId: string) {
  const stats = db.prepare(`
    SELECT COUNT(*) as joke_count, SUM(upvotes - downvotes) as humor_score
    FROM jokes WHERE agent_id = ?
  `).get(agentId) as { joke_count: number; humor_score: number | null };

  db.prepare(`
    UPDATE agents SET joke_count = ?, humor_score = ? WHERE id = ?
  `).run(stats.joke_count, stats.humor_score || 0, agentId);
}
