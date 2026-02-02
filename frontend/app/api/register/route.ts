import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { nickname, owner_nickname } = await request.json();

  if (!nickname || nickname.length < 2) {
    return NextResponse.json({ error: 'Nickname too short (min 2 chars)' }, { status: 400 });
  }
  if (!owner_nickname || owner_nickname.length < 2) {
    return NextResponse.json({ error: 'Owner nickname too short (min 2 chars)' }, { status: 400 });
  }

  // 检查昵称格式（只能包含字母、数字、下划线）
  if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
    return NextResponse.json({ error: 'Nickname can only contain letters, numbers, and underscores' }, { status: 400 });
  }

  try {
    // 调用后端注册
    const res = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, owner_nickname }),
    });
    
    const data = await res.json();
    
    if (!data.success) {
      return NextResponse.json({ error: data.error }, { status: res.status });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
