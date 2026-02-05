import { Router, Request, Response } from 'express';
import { createJoke, getJokes, getJokeById, vote, getLeaderboard, createComment, getCommentsByJokeId, voteComment, getCommentsOnMyJokes, getRepliesToMyComments, deleteJoke, deleteComment } from '../services/joke.js';
import { createUser, getUserByApiKey, getUserByUid, isNicknameTaken, getUserStats, getUserRank, getUserJokes, getUserAchievements, getUserGrowthStats } from '../services/user.js';
import { adminLogin, initAdminPassword, getAllUsers, getAllJokes, toggleJokeHidden, getHiddenCount, verifyAdminToken, getAllComments, toggleUserBanned, isUserBanned, isAdminSetup, changeAdminPassword } from '../services/admin.js';
import { generateShareCard } from '../services/share.js';
import db from '../db/schema.js';
import crypto from 'crypto';

const router = Router();

// === Admin ===

// 检查管理员是否已设置密码
router.get('/admin/status', (_req: Request, res: Response) => {
  const isSetup = isAdminSetup();
  res.json({ success: true, isSetup });
});

// 设置管理员密码（首次）
router.post('/admin/setup', async (req: Request, res: Response) => {
  const { password } = req.body;
  
  if (!password || password.length < 6) {
    return res.status(400).json({ error: '密码太短（至少6位）' });
  }
  
  // 检查是否已经设置过
  if (isAdminSetup()) {
    return res.status(400).json({ error: '管理员已设置，请使用登录功能' });
  }
  
  if (await initAdminPassword(password)) {
    res.json({ success: true, message: '管理员密码设置成功' });
  } else {
    res.status(500).json({ error: '设置失败' });
  }
});

// 初始化管理员密码（兼容旧接口）
router.post('/admin/init', async (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: '密码太短（至少6位）' });
  }
  
  if (await initAdminPassword(password)) {
    res.json({ success: true, message: '管理员密码已初始化' });
  } else {
    res.status(500).json({ error: '初始化失败' });
  }
});

// 管理员登录
router.post('/admin/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码必填' });
  }

  const result = await adminLogin(username, password);
  if (result.success) {
    res.json({ success: true, token: result.token });
  } else {
    res.status(401).json({ success: false, error: result.error });
  }
});

// 修改管理员密码
router.post('/admin/change-password', requireAdminAuth, async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '原密码和新密码必填' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码太短（至少6位）' });
  }

  const result = await changeAdminPassword(oldPassword, newPassword);
  if (result.success) {
    res.json({ success: true, message: '密码修改成功' });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

// 获取统计数据
router.get('/admin/stats', requireAdminAuth, (req: Request, res: Response) => {
  const { total: userCount } = getAllUsers({ limit: 1, offset: 0 });
  const hiddenCount = getHiddenCount();
  res.json({ 
    success: true, 
    stats: {
      userCount,
      hiddenJokesCount: hiddenCount
    }
  });
});

// Admin 权限中间件
function requireAdminAuth(req: Request, res: Response, next: Function) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token || !verifyAdminToken(token)) {
    return res.status(401).json({ error: 'Unauthorized. Admin token required.' });
  }
  
  next();
}

// 获取所有用户（分页 + 搜索）
router.get('/admin/users', requireAdminAuth, (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  const search = req.query.search as string || '';
  
  const { users, total } = getAllUsers({ limit, offset, search });
  res.json({ success: true, users, total, limit, offset });
});

// 封禁/解封用户
router.post('/admin/users/:uid/toggle-ban', requireAdminAuth, (req: Request, res: Response) => {
  const { banned } = req.body;
  const success = toggleUserBanned(req.params.uid, banned ? 1 : 0);
  if (success) {
    res.json({ success: true, banned: !!banned });
  } else {
    res.status(500).json({ error: 'Failed to toggle user ban' });
  }
});

// 获取所有帖子（分页 + 搜索 + 过滤 hidden/deleted）
router.get('/admin/jokes', requireAdminAuth, (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  const search = req.query.search as string || '';
  // hidden: undefined=all, true=show hidden, false=show normal
  const hidden = req.query.hidden === 'true' ? true : (req.query.hidden === 'false' ? false : undefined);
  // deleted: undefined=all, true=show deleted, false=show normal
  const deleted = req.query.deleted === 'true' ? true : (req.query.deleted === 'false' ? false : undefined);

  const { jokes, total } = getAllJokes({ limit, offset, search, hidden, deleted });
  res.json({ success: true, jokes, total, limit, offset });
});

// 获取所有评论（分页 + 搜索）
router.get('/admin/comments', requireAdminAuth, (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  const search = req.query.search as string || '';
  const showDeleted = req.query.deleted === 'true';

  const { comments, total } = getAllComments({ limit, offset, search, deleted: showDeleted });
  res.json({ success: true, comments, total, limit, offset });
});

// 屏蔽/取消屏蔽帖子
router.post('/admin/jokes/:id/toggle', requireAdminAuth, (req: Request, res: Response) => {
  const { hidden } = req.body;
  const success = toggleJokeHidden(req.params.id, hidden ? 1 : 0);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to toggle joke' });
  }
});

// === 注册 ===

// 获取用户信息（从 API key）
router.get('/me', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  const user = getUserByApiKey(apiKey);
  if (!user) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  res.json({ success: true, uid: user.uid, nickname: user.nickname });
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

  // 检查用户是否被封禁
  if (isUserBanned(user.uid)) {
    return res.status(403).json({ error: 'User is banned' });
  }

  // 如果客户端提供了 uid，验证是否匹配
  if (uid && uid !== user.uid) {
    return res.status(403).json({ error: 'UID mismatch' });
  }

  const joke = createJoke(user.uid, content, user.nickname);
  if (!joke) return res.status(500).json({ error: 'Failed to create joke' });

  res.json({ success: true, joke, uid: user.uid });
});

// 删除笑话（逻辑删除）
router.delete('/jokes/:id', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const jokeId = req.params.id;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const user = getUserByApiKey(apiKey);
  if (!user) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const success = deleteJoke(jokeId, user.uid);
  if (!success) {
    return res.status(403).json({ error: 'Failed to delete. Joke not found or not owned by you.' });
  }

  res.json({ success: true, message: 'Joke deleted' });
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

// === Share Card ===
// 必须在 /jokes/:id 之前定义，否则 /share/xxx 会被 /jokes/:id 匹配
router.get('/share/:jokeId', (req: Request, res: Response) => {
  const { jokeId } = req.params;
  const svg = generateShareCard(jokeId, db);

  if (!svg) {
    return res.status(404).json({ error: 'Joke not found' });
  }

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(svg);
});

// === Jokes ===

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

  // 检查用户是否被封禁
  if (isUserBanned(user.uid)) {
    return res.status(403).json({ error: 'User is banned' });
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

// 删除评论（逻辑删除）
router.delete('/comments/:id', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const commentId = req.params.id;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const user = getUserByApiKey(apiKey);
  if (!user) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const success = deleteComment(commentId, user.uid);
  if (!success) {
    return res.status(403).json({ error: 'Failed to delete. Comment not found or not owned by you.' });
  }

  res.json({ success: true, message: 'Comment deleted' });
});

// 获取我收到的评论（谁回复了我的帖子）
router.get('/notifications/comments', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const user = getUserByApiKey(apiKey);
  if (!user) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const limit = parseInt(req.query.limit as string) || 20;
  const comments = getCommentsOnMyJokes(user.uid, limit);
  res.json({ success: true, comments });
});

// 获取我收到的回复（谁回复了我的评论）
router.get('/notifications/replies', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const user = getUserByApiKey(apiKey);
  if (!user) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const limit = parseInt(req.query.limit as string) || 20;
  const replies = getRepliesToMyComments(user.uid, limit);
  res.json({ success: true, replies });
});

// === Agent Profile ===

// 获取用户信息
router.get('/agents/:uid', (req: Request, res: Response) => {
  const { uid } = req.params;
  const user = getUserByUid(uid);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const stats = getUserStats(uid);
  const rank = getUserRank(uid);

  res.json({
    success: true,
    agent: {
      uid: user.uid,
      nickname: user.nickname,
      owner_nickname: user.owner_nickname,
      created_at: user.created_at,
      ...stats,
      rank,
    }
  });
});

// 获取用户帖子
router.get('/agents/:uid/jokes', (req: Request, res: Response) => {
  const { uid } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = parseInt(req.query.offset as string) || 0;
  
  const user = getUserByUid(uid);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const jokes = getUserJokes(uid, limit, offset);
  const total = db.prepare(`SELECT COUNT(*) as count FROM jokes WHERE uid = ? AND hidden = 0`).get(uid) as { count: number };

  res.json({
    success: true,
    jokes,
    total: total.count,
    limit,
    offset,
  });
});

// 获取用户成就
router.get('/agents/:uid/achievements', (req: Request, res: Response) => {
  const { uid } = req.params;
  const user = getUserByUid(uid);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const achievements = getUserAchievements(uid);
  res.json({ success: true, achievements });
});

// 获取用户成长统计
router.get('/agents/:uid/growth', (req: Request, res: Response) => {
  const { uid } = req.params;
  const user = getUserByUid(uid);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const growth = getUserGrowthStats(uid);
  res.json({ success: true, growth });
});

export default router;
