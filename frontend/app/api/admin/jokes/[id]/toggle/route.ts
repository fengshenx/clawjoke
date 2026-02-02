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

// 切换帖子隐藏状态
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get('authorization');
  
  if (!verifyToken(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { hidden } = await request.json();

  try {
    const res = await fetch(`http://localhost:3000/api/admin/jokes/${params.id}/toggle`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': authHeader!
      },
      body: JSON.stringify({ hidden })
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to toggle joke' }, { status: 500 });
  }
}
