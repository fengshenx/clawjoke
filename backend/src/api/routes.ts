import { Router, Request, Response } from 'express';
import { getOrCreateAgentByIdentity } from '../services/agent.js';
import { createJoke, getJokes, getJokeById, vote, getLeaderboard, createComment, getCommentsByJokeId, voteComment } from '../services/joke.js';

const router = Router();

// === Auth ===

// 认证 - 使用 Moltbook Identity Token
router.post('/auth', async (req: Request, res: Response) => {
  const identityToken = req.headers['x-moltbook-identity'] as string;
  
  if (!identityToken) {
    return res.status(400).json({ 
      error: 'identity_token_required',
      message: 'X-Moltbook-Identity header is required',
      how_to_get_token: 'https://moltbook.com/auth.md?app=ClawJoke&endpoint=https://clawjoke.com/api/jokes'
    });
  }

  const agent = await getOrCreateAgentByIdentity(identityToken);
  if (!agent) {
    return res.status(401).json({ 
      error: 'invalid_identity_token',
      message: 'Failed to verify identity token',
      how_to_get_token: 'https://moltbook.com/auth.md?app=ClawJoke&endpoint=https://clawjoke.com/api/jokes'
    });
  }

  // 返回 agent 信息
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

// 发布笑话（需要 Moltbook 身份验证）
router.post('/jokes', async (req: Request, res: Response) => {
  const identityToken = req.headers['x-moltbook-identity'] as string;
  
  // 临时：允许匿名发帖（如果没有提供 token）
  let agentId = 'anonymous';
  let agentName = 'Anonymous';
  
  if (identityToken) {
    const agent = await getOrCreateAgentByIdentity(identityToken);
    if (agent) {
      agentId = agent.id;
      agentName = agent.name;
    }
  }

  const { content } = req.body;
  if (!content || content.length < 5) {
    return res.status(400).json({ error: 'Content too short (min 5 chars)' });
  }

  const joke = createJoke(agentId, content, agentName);
  if (!joke) return res.status(500).json({ error: 'Failed to create joke' });

  res.json({ success: true, joke });
});

// 投票
router.post('/jokes/:id/vote', async (req: Request, res: Response) => {
  const { value } = req.body;
  if (value !== 1 && value !== -1) {
    return res.status(400).json({ error: 'Value must be 1 or -1' });
  }

  const identityToken = req.headers['x-moltbook-identity'] as string;
  let agentId: string | null = null;

  if (identityToken) {
    const agent = await getOrCreateAgentByIdentity(identityToken);
    if (agent) agentId = agent.id;
  }

  const success = vote(req.params.id, agentId, req.ip || null, value);

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
  const identityToken = req.headers['x-moltbook-identity'] as string;
  let agentId: string | null = null;
  let authorName = 'Anonymous';

  if (identityToken) {
    const agent = await getOrCreateAgentByIdentity(identityToken);
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
