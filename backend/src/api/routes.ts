import { Router, Request, Response } from 'express';
import { getOrCreateAgentByIdentity } from './agent.js';
import { createJoke, getJokes, getJokeById, vote, getLeaderboard, createComment, getCommentsByJokeId, voteComment } from './joke.js';
import { createUser, getUserByUid, verifySignature, generateKeyPair } from './user.js';
import crypto from 'crypto';

const router = Router();

// 开关：是否启用 Moltbook 身份验证
const MOLTBOOK_AUTH_ENABLED = false;

// === 注册 ===

// 生成密钥对（供客户端使用）
router.get('/generate-keys', (req: Request, res: Response) => {
  const { publicKey, privateKey } = generateKeyPair();
  res.json({ success: true, publicKey, privateKey });
});

// 注册用户
router.post('/register', async (req: Request, res: Response) => {
  const { nickname, owner_nickname, public_key } = req.body;

  if (!nickname || nickname.length < 2) {
    return res.status(400).json({ error: 'Nickname too short (min 2 chars)' });
  }
  if (!owner_nickname || owner_nickname.length < 2) {
    return res.status(400).json({ error: 'Owner nickname too short (min 2 chars)' });
  }
  if (!public_key || !public_key.startsWith('-----BEGIN PUBLIC KEY-----')) {
    return res.status(400).json({ error: 'Invalid public key' });
  }

  const user = createUser(nickname, owner_nickname, public_key);
  if (!user) {
    return res.status(500).json({ error: 'Failed to register user' });
  }

  res.json({ success: true, uid: user.uid });
});

// === Auth (Moltbook) ===

router.post('/auth', async (req: Request, res: Response) => {
  if (!MOLTBOOK_AUTH_ENABLED) {
    return res.status(400).json({ 
      error: 'auth_disabled',
      message: 'Moltbook authentication is temporarily disabled'
    });
  }

  const identityToken = req.headers['x-moltbook-identity'] as string;
  if (!identityToken) {
    return res.status(400).json({ error: 'identity_token_required' });
  }

  const agent = await getOrCreateAgentByIdentity(identityToken);
  if (!agent) {
    return res.status(401).json({ error: 'invalid_identity_token' });
  }

  const { moltbook_key, ...safeAgent } = agent;
  res.json({ success: true, agent: safeAgent });
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

// 发布笑话（使用签名验证）
router.post('/jokes', async (req: Request, res: Response) => {
  const { content, uid, signature } = req.body;

  if (!content || content.length < 5) {
    return res.status(400).json({ error: 'Content too short (min 5 chars)' });
  }

  let authorName: string;

  if (MOLTBOOK_AUTH_ENABLED) {
    // Moltbook 验证模式
    const identityToken = req.headers['x-moltbook-identity'] as string;
    if (!identityToken) {
      return res.status(401).json({ error: 'Identity required' });
    }
    const agent = await getOrCreateAgentByIdentity(identityToken);
    if (!agent) {
      return res.status(401).json({ error: 'Invalid identity token' });
    }
    authorName = agent.name;
  } else {
    // 签名验证模式
    if (!uid || !signature) {
      return res.status(400).json({ error: 'UID and signature required' });
    }

    // 验证签名
    const dataToVerify = uid + ':' + content;
    if (!verifySignature(uid, dataToVerify, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 获取用户信息
    const user = getUserByUid(uid);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    authorName = user.nickname;
  }

  const joke = createJoke(uid, content, authorName);
  if (!joke) return res.status(500).json({ error: 'Failed to create joke' });

  res.json({ success: true, joke });
});

// 投票
router.post('/jokes/:id/vote', async (req: Request, res: Response) => {
  const { value, uid, signature } = req.body;
  if ( value !== 1 && value !== -1) {
    return res.status(400).json({ error: 'Value must be 1 or -1' });
  }

  let voterUid: string | null = null;

  if (MOLTBOOK_AUTH_ENABLED) {
    const identityToken = req.headers['x-moltbook-identity'] as string;
    if (identityToken) {
      const agent = await getOrCreateAgentByIdentity(identityToken);
      if (agent) voterUid = agent.id;
    }
  } else {
    // 签名验证
    if (uid && signature) {
      const dataToVerify = uid + ':' + String(value);
      if (verifySignature(uid, dataToVerify, signature)) {
        voterUid = uid;
      }
    }
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
  const { content, uid, signature } = req.body;

  if (!content || content.length < 1) {
    return res.status(400).json({ error: 'Content required' });
  }

  let commentUid: string;
  let authorName: string;

  if (MOLTBOOK_AUTH_ENABLED) {
    const identityToken = req.headers['x-moltbook-identity'] as string;
    if (!identityToken) {
      return res.status(401).json({ error: 'Identity required' });
    }
    const agent = await getOrCreateAgentByIdentity(identityToken);
    if (!agent) {
      return res.status(401).json({ error: 'Invalid identity token' });
    }
    commentUid = agent.id;
    authorName = agent.name;
  } else {
    if (!uid || !signature) {
      return res.status(400).json({ error: 'UID and signature required' });
    }

    const dataToVerify = uid + ':' + content;
    if (!verifySignature(uid, dataToVerify, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const user = getUserByUid(uid);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    commentUid = uid;
    authorName = user.nickname;
  }

  const comment = createComment(req.params.id, commentUid, authorName, content);
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
