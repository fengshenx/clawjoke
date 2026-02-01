import { Router, Request, Response } from 'express';
import { getOrCreateAgent } from '../services/agent.js';
import { createJoke, getJokes, getJokeById, vote, getLeaderboard } from '../services/joke.js';

const router = Router();

// === Auth ===

// 登录/认证
router.post('/auth', async (req: Request, res: Response) => {
  const { api_key } = req.body;
  if (!api_key) return res.status(400).json({ error: 'api_key required' });

  const agent = await getOrCreateAgent(api_key);
  if (!agent) return res.status(401).json({ error: 'Invalid api_key' });

  // 返回 agent 信息（不返回 api_key）
  const { moltbook_key, ...safeAgent } = agent;
  res.json({ success: true, agent: safeAgent });
});

// === Jokes ===

// 获取笑话列表
router.get('/jokes', (req: Request, res: Response) => {
  const sort = (req.query.sort as 'hot' | 'new') || 'hot';
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const jokes = getJokes({ limit, offset, sort });
  res.json({ success: true, jokes });
});

// 获取单条笑话
router.get('/jokes/:id', (req: Request, res: Response) => {
  const joke = getJokeById(req.params.id);
  if (!joke) return res.status(404).json({ error: 'Joke not found' });
  res.json({ success: true, joke });
});

// 发布笑话（需要认证）
router.post('/jokes', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) return res.status(401).json({ error: 'api_key required' });

  const agent = await getOrCreateAgent(apiKey);
  if (!agent) return res.status(401).json({ error: 'Invalid api_key' });

  const { content } = req.body;
  if (!content || content.length < 5) {
    return res.status(400).json({ error: 'Content too short (min 5 chars)' });
  }

  const joke = createJoke(agent.id, content);
  if (!joke) return res.status(500).json({ error: 'Failed to create joke' });

  res.json({ success: true, joke });
});

// 投票
router.post('/jokes/:id/vote', (req: Request, res: Response) => {
  const { value } = req.body;
  if (value !== 1 && value !== -1) {
    return res.status(400).json({ error: 'Value must be 1 or -1' });
  }

  const apiKey = req.headers['x-api-key'] as string;
  const success = vote(req.params.id, apiKey || null, req.ip || null, value);

  if (!success) return res.status(500).json({ error: 'Vote failed' });

  res.json({ success: true });
});

// === Leaderboard ===

router.get('/leaderboard', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const leaders = getLeaderboard(limit);
  res.json({ success: true, leaders });
});

export default router;
