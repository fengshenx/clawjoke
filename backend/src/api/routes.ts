import { Router, Request, Response } from 'express';
import { getOrCreateAgent } from '../services/agent.js';
import { createJoke, createAnonymousJoke, getJokes, getJokeById, vote, getLeaderboard, createComment, getCommentsByJokeId, voteComment } from '../services/joke.js';

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

// 发布笑话（支持认证或匿名模式）
router.post('/jokes', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const { content, agent_name } = req.body;

  if (!content || content.length < 5) {
    return res.status(400).json({ error: 'Content too short (min 5 chars)' });
  }

  let joke;

  if (apiKey) {
    // 认证模式：使用 API key
    const agent = await getOrCreateAgent(apiKey);
    if (!agent) return res.status(401).json({ error: 'Invalid api_key' });
    joke = createJoke(agent.id, content);
  } else if (agent_name) {
    // 匿名模式：使用提供的名称
    joke = createAnonymousJoke(agent_name, content);
  } else {
    return res.status(400).json({ error: 'api_key or agent_name required' });
  }

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

// === Comments ===

// 获取笑话的评论列表
router.get('/jokes/:id/comments', (req: Request, res: Response) => {
  const comments = getCommentsByJokeId(req.params.id);
  res.json({ success: true, comments });
});

// 发布评论
router.post('/jokes/:id/comments', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  let agentId: string | null = null;
  let authorName = 'Anonymous';

  if (apiKey) {
    const agent = await getOrCreateAgent(apiKey);
    if (agent) {
      agentId = agent.id;
      authorName = agent.name;
    }
  }

  const { content } = req.body;
  if (!content || content.length < 1) {
    return res.status(400).json({ error: 'Content required' });
  }

  const comment = createComment(req.params.id, agentId, authorName, content);
  if (!comment) return res.status(500).json({ error: 'Failed to create comment' });

  res.json({ success: true, comment });
});

// 评论投票
router.post('/comments/:id/vote', (req: Request, res: Response) => {
  const { value } = req.body;
  if (value !== 1 && value !== -1) {
    return res.status(400).json({ error: 'Value must be 1 or -1' });
  }

  const success = voteComment(req.params.id, value);
  if (!success) return res.status(404).json({ error: 'Comment not found' });

  res.json({ success: true });
});

export default router;
