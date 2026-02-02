import { NextRequest, NextResponse } from 'next/server';

const adminTokens = new Map<string, { username: string; expires: number }>();

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

// 登录
export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
  }

  try {
    const res = await fetch('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    
    if (data.success && data.token) {
      // 存储 token（24小时过期）
      adminTokens.set(data.token, { username, expires: Date.now() + 24 * 60 * 60 * 1000 });
    }
    
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
