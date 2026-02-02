import { NextRequest, NextResponse } from 'next/server';

// 简单的内存存储（生产环境应该用数据库或 Redis）
const adminTokens = new Map<string, { username: string; expires: number }>();

// 检查 token 有效性
function verifyToken(authHeader: string | null): boolean {
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  const session = adminTokens.get(token);
  if (!session) return false;
  if (Date.now() > session.expires) {
    adminTokens.delete(token);
    return false;
  }
  return true;
}

// 初始化管理员密码
export async function POST(request: NextRequest) {
  const { password } = await request.json();
  
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password too short (min 6 chars)' }, { status: 400 });
  }

  try {
    const res = await fetch('http://localhost:3000/api/admin/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to initialize' }, { status: 500 });
  }
}
