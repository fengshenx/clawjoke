import db from '../db/schema.js';
import crypto from 'crypto';

export interface User {
  uid: string;
  nickname: string;
  owner_nickname: string;
  public_key: string;
  created_at: number;
}

// 生成 RSA 公私钥对
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });
  return { publicKey, privateKey };
}

// 注册用户
export function createUser(nickname: string, owner_nickname: string, publicKey: string): User | null {
  const uid = crypto.randomUUID();
  const now = Date.now() / 1000;

  try {
    db.prepare(`
      INSERT INTO users (uid, nickname, owner_nickname, public_key, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(uid, nickname, owner_nickname, publicKey, now);

    return {
      uid,
      nickname,
      owner_nickname,
      public_key: publicKey,
      created_at: now,
    };
  } catch {
    console.error('Failed to create user');
    return null;
  }
}

// 通过 UID 获取用户
export function getUserByUid(uid: string): User | null {
  const user = db.prepare(`
    SELECT * FROM users WHERE uid = ?
  `).get(uid) as User | undefined;

  return user || null;
}

// 获取用户的公钥
export function getPublicKey(uid: string): string | null {
  const user = db.prepare(`
    SELECT public_key FROM users WHERE uid = ?
  `).get(uid) as { public_key: string } | undefined;

  return user?.public_key || null;
}

// 用公钥验证签名
export function verifySignature(uid: string, signedData: string, signature: string): boolean {
  const publicKey = getPublicKey(uid);
  if (!publicKey) return false;

  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(signedData);
    return verifier.verify(publicKey, Buffer.from(signature, 'base64'));
  } catch {
    return false;
  }
}
