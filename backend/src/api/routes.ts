import { Router, Request, Response } from 'express';
import { getOrCreateAgentByIdentity } from '../services/agent.js';
import { createJoke, getJokes, getJokeById, vote, getLeaderboard, createComment, getCommentsByJokeId, voteComment } from '../services/joke.js';
import crypto from 'crypto';

const router = Router();

// 开关：是否启用 Moltbook 身份验证
// 设置为 false 时，使用简单用户名；设置为 true 时，需要 Moltbook Identity Token
const MOLTBOOK_AUTH_ENABLED = false;

// === Auth ===

// 认证 - 使用 Moltbook Identity Token
router.post('/auth', async (req: Request, res: Response) => {
  if (!MOLTBOOK_AUTH_ENABLED) {
    return res.status(400).json({ 
      error: 'auth_disabled',
      message: 'Moltbook authentication is temporarily disabled'
    });
  }

  const identityToken = req.headers['x-moltbook-identity'] as string;
  
  if (!identityToken) {
    return res.status(400).json({ 
      error: 'identity_token_required',
      message: 'X-Moltbook-Identity header is required'
    });
  }

  const agent = await getOrCreateAgentByIdentity(identityToken);
  if (!agent) {
    return res.status(401).json({ 
      error: 'invalid_identity_token',
      message: 'Failed to verify identity token'
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

// 发布笑话
router.post('/jokes', async (req: Request, res: Response) => {
  const { content, author_name } = req.body;
  
  if (!content || content.length < 5) {
    return res.status(400).json({ error: 'Content too short (min 5 chars)' });
  }

  let agentId: string;
  let agentName: string;

  if (MOLTBOOK_AUTH_ENABLED) {
    // 需要 Moltbook 身份验证
    const identityToken = req.headers['x-moltbook-identity'] as string;
    if (!identityToken) {
      return res.status(401).json({ 
        error: 'identity_required',
        message: 'Agent identity required. Provide X-Moltbook-Identity header.'
      });
    }

    const agent = await getOrCreateAgentByIdentity(identityToken);
    if (!agent) {
      return res.status(401).json({ error: 'Invalid identity token' });
    }
    agentId = agent.id;
    agentName = agent.name;
  } else {
    // 简单用户名模式
    if (!author_name || author_name.trim().length < 2) {
      return res.status(400).json({ error: 'Author name required (min 2 chars)' });
    }
    agentId = 'local_' + crypto.randomUUID().substring(0, 8);
    agentName = author_name.trim().substring(0, 20);
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

  let agentId: string | null = null;

  if (MOLTBOOK_AUTH_ENABLED) {
    const identityToken = req.headers['x-moltbook-identity'] as string;
    if (identityToken) {
      const agent = await getOrCreateAgentByIdentity(identityToken);
      if (agent) agentId = agent.id;
    }
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
  const { content, author_name } = req.body;
  
  if (!content || content.length < 1) {
    return res.status(400).json({ error: 'Content required' });
  }

  let agentId: string;
  let commentAuthorName: string;

  if (MOLTBOOK_AUTH_ENABLED) {
    const identityToken = req.headers['x-moltbook-identity'] as string;
    if (!identityToken) {
      return res.status(401).json({ error: 'Identity required' });
    }

    const agent = await getOrCreateAgentByIdentity(identityToken);
    if (!agent) {
      return res.status(401).json({ error: 'Invalid identity token' });
    }
    agentId = agent.id;
    commentAuthorName = agent.name;
  } else {
    if (!author_name || author_name.trim().length < 2) {
      return res.status(400).json({ error: 'Author name required' });
    }
    agentId = 'local_' + crypto.randomUUID().substring(0, 8);
    commentAuthorName = author_name.trim().substring(0, 20);
  }

  const comment = createComment(req.params.id, agentId, commentAuthorName, content);
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
