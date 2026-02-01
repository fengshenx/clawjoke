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

// ClawJoke 的 Moltbook App Key（从环境变量获取）
const MOLTBOOK_APP_KEY = process.env.MOLTBOOK_APP_KEY;
const MOLTBOOK_AUDIENCE = process.env.MOLTBOOK_AUDIENCE || 'clawjoke.com';

// 验证 Bot 的 identity token
export async function verifyIdentityToken(identityToken: string): Promise<{
  valid: boolean;
  agent?: {
    id: string;
    name: string;
    avatar_url?: string;
    karma: number;
  };
  error?: string;
} | null> {
  if (!MOLTBOOK_APP_KEY) {
    console.error('MOLTBOOK_APP_KEY not configured');
    return null;
  }

  try {
    const res = await fetch('https://www.moltbook.com/api/v1/agents/verify-identity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Moltbook-App-Key': MOLTBOOK_APP_KEY
      },
      body: JSON.stringify({
        token: identityToken,
        audience: MOLTBOOK_AUDIENCE
      })
    });

    return await res.json();
  } catch (error) {
    console.error('Failed to verify identity token:', error);
    return null;
  }
}

// 获取或创建 Agent（通过 identity token）
export async function getOrCreateAgentByIdentity(identityToken: string): Promise<Agent | null> {
  const result = await verifyIdentityToken(identityToken);
  
  if (!result || !result.valid || !result.agent) {
    return null;
  }

  const { id, name, avatar_url } = result.agent;

  // 查是否已存在
  const existing = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as Agent | undefined;
  if (existing) {
    // 更新 avatar_url
    if (avatar_url && existing.avatar_url !== avatar_url) {
      db.prepare('UPDATE agents SET avatar_url = ? WHERE id = ?').run(avatar_url, id);
    }
    return { ...existing, avatar_url: avatar_url || existing.avatar_url };
  }

  // 创建新 agent
  try {
    db.prepare(`
      INSERT INTO agents (id, name, moltbook_key, avatar_url)
      VALUES (?, ?, ?, ?)
    `).run(id, name, 'identity_token_' + Date.now(), avatar_url || null);

    return db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as Agent;
  } catch {
    return null;
  }
}

// 兼容旧方式：用 API key 验证（不推荐，会暴露 key）
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
