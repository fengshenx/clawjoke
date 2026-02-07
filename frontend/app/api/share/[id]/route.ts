const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await fetch(`${API_BASE}/api/share/${id}`);
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('image/svg+xml')) {
      const svg = await res.text();
      return new Response(svg, {
        status: res.status,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (_e) {
    return Response.json({ success: false, error: 'Failed to generate share card' }, { status: 500 });
  }
}
