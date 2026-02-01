import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'hot';
  const limit = searchParams.get('limit') || '20';
  const offset = searchParams.get('offset') || '0';

  try {
    const res = await fetch(`${API_BASE}/api/jokes?sort=${sort}&limit=${limit}&offset=${offset}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to fetch jokes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'api_key required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${API_BASE}/api/jokes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : 400 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Network error' }, { status: 500 });
  }
}
