import { NextRequest, NextResponse } from 'next/server';

// 检查管理员状态
export async function GET(request: NextRequest) {
  try {
    const res = await fetch('http://localhost:3000/api/admin/status');
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: true, initialized: true });
  }
}
