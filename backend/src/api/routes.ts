import { Router, Request, Response } from 'express';
import { createJoke, getJokes, getJokeById, vote, getLeaderboard, createComment, getCommentsByJokeId, voteComment, getAllComments } from '../services/joke.js';
import { createUser, getUserByApiKey, getUserByUid } from '../services/user.js';
import { adminLogin, initAdminPassword, getAllUsers, getAllJokes, toggleJokeHidden, getHiddenCount, isAdminInitialized } from '../services/admin.js';
import crypto from 'crypto';

const router = Router();

// === Admin ===

// 检查管理员是否已初始化
router.get('/admin/status', (_req: Request, res: Response) => {
  const initialized = isAdminInitialized();
  res.json({ success: true, initialized });
});

// 初始化管理员密码
router.post('/admin/init', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password too short (min 6 chars)' });
  }
  
  if (initAdminPassword(password)) {
    res.json({ success: true, message: 'Admin password initialized' });
  } else {
    res.status(500).json({ error: 'Failed to initialize admin password' });
  }
});

// 管理员登录
router.post('/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const result = adminLogin(username, password);
  if (result.success) {
    res.json({ success: true, token: result.token });
  } else {
    res.status(401).json({ success: false, error: result.error });
  }
});

// 获取统计数据
router.get('/admin/stats', (req: Request, res: Response) => {
  const users = getAllUsers();
  const hiddenCount = getHiddenCount();
  res.json({ 
    success: true, 
    stats: {
      userCount: users.length,
      hiddenJokesCount: hiddenCount
    }
  });
});

// 获取所有用户
router.get('/admin/users', (req: Request, res: Response) => {
  const users = getAllUsers();
  res.json({ success: true, users });
});

// 获取所有帖子
router.get('/admin/jokes', (req: Request, res: Response) => {
  const jokes = getAllJokes();
  res.json({ success: true, jokes });
});

// 获取所有评论
router.get('/admin/comments', (req: Request, res: Response) => {
  const comments = getAllComments();
  res.json({ success: true, comments });
});

// 屏蔽/取消屏蔽帖子
router.post('/admin/jokes/:id/toggle', (req: Request, res: Response) => {
  const { hidden } = req.body;
  const success = toggleJokeHidden(req.params.id, hidden ? 1 : 0);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to toggle joke' });
  }
});

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

  // 检查昵称是否已存在
  if (isNicknameTaken(nickname)) {
    return res.status(409).json({ error: 'Nickname already taken' });
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
  const sort = (req.query.sort as 'hot' | 'new') || 'new';
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = parseInt(req.query.offset as string) || 0;
  const jokes = getJokes({ limit, offset, sort });
  res.json({ success: true, jokes, offset: offset + limit, has_more: jokes.length === limit });
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
