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

// 获取所有评论
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!verifyToken(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch('http://localhost:3000/api/admin/comments', {
      headers: { 'Authorization': authHeader! }
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}
