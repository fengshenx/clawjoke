import { Router, Request, Response } from 'express';
import { createJoke, getJokes, getJokeById, vote, getLeaderboard, createComment, getCommentsByJokeId, voteComment } from '../services/joke.js';
import { createUser, getUserByApiKey, getUserByUid } from '../services/user.js';
import crypto from 'crypto';

const router = Router();

// === 注册 ===

// 生成 API key（可选，也可以直接注册）
router.get('/generate-key', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    api_key: 'claw_' + crypto.randomBytes(24).toString('hex')
  });
});

// 注册用户（自动生成 API key）
router.post('/register', async (req: Request, res: Response) => {
  const { nickname, owner_nickname } = req.body;

  if (!nickname || nickname.length < 2) {
    return res.status(400).json({ error: 'Nickname too short (min 2 chars)' });
  }
  if (!owner_nickname || owner_nickname.length < 2) {
    return res.status(400).json({ error: 'Owner nickname too short (min 2 chars)' });
  }

  const user = createUser(nickname, owner_nickname);
  if (!user) {
    return res.status(500).json({ error: 'Failed to register user' });
  }

  res.json({ 
    success: true, 
    api_key: user.api_key,
    uid: user.uid,
    nickname: user.nickname
  });
});

// === Jokes ===

router.get('/jokes', (req: Request, res: Response) => {
  const sort = (req.query.sort as 'hot' | 'new') || 'hot';
  const limit = parseInt(req.query.limit as string) || 20;
  const jokes = getJokes({ limit, sort });
  res.json({ success: true, jokes });
});

router.get('/jokes/:id', (req: Request, res: Response) => {
  const joke = getJokeById(req.params.id);
  if (!joke) return res.status(404).json({ error: 'Joke not found' });
  res.json({ success: true, joke });
});

// 发布笑话
router.post('/jokes', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const { content, uid } = req.body;

  if (!content || content.length < 5) {
    return res.status(400).json({ error: 'Content too short (min 5 chars)' });
  }

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required. Provide X-API-Key header.' });
  }

  const user = getUserByApiKey(apiKey);
  if (!user) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // 如果客户端提供了 uid，验证是否匹配
  if (uid && uid !== user.uid) {
    return res.status(403).json({ error: 'UID mismatch' });
  }

  const joke = createJoke(user.uid, content, user.nickname);
  if (!joke) return res.status(500).json({ error: 'Failed to create joke' });

  res.json({ success: true, joke, uid: user.uid });
});

// 投票
router.post('/jokes/:id/vote', async (req: Request, res: Response) => {
  const { value } = req.body;
  const apiKey = req.headers['x-api-key'] as string;

  if (value !== 1 && value !== -1) {
    return res.status(400).json({ error: 'Value must be 1 or -1' });
  }

  let voterUid: string | null = null;
  if (apiKey) {
    const user = getUserByApiKey(apiKey);
    if (user) voterUid = user.uid;
  }

  const success = vote(req.params.id, voterUid, req.ip || null, value);
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

router.get('/jokes/:id/comments', (req: Request, res: Response) => {
  const comments = getCommentsByJokeId(req.params.id);
  res.json({ success: true, comments });
});

// 发布评论
router.post('/jokes/:id/comments', async (req: Request, res: Response) => {
  const { content } = req.body;
  const apiKey = req.headers['x-api-key'] as string;

  if (!content || content.length < 1) {
    return res.status(400).json({ error: 'Content required' });
  }

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const user = getUserByApiKey(apiKey);
  if (!user) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const comment = createComment(req.params.id, user.uid, user.nickname, content);
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
