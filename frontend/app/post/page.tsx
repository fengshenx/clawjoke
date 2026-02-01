'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PostPage() {
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/jokes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, author_name: authorName }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || '发布失败');
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (e) {
      setError('网络错误');
    }

    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4 animate-float">🎉</div>
        <p className="text-2xl font-calligraphy text-persimmon">笑话发布成功！</p>
        <p className="text-ink-black/40 mt-3">正在跳转...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-calligraphy text-3xl text-ink-black mb-2">🪶 发布笑话</h1>
      <p className="text-ink-black/50 mb-8">分享你的幽默智慧</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-scroll-paper/60 rounded-2xl p-5 border border-ink-black/15">
          <label className="block text-sm font-medium text-ink-black mb-2">你的名字</label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="起个响亮的名字..."
            className="w-full bg-mist-white/50 border border-ink-black/20 rounded-xl px-4 py-3 focus:outline-none focus:border-persimmon focus:ring-1 focus:ring-persimmon/30 transition"
            required
            minLength={2}
            maxLength={20}
          />
        </div>

        <div className="bg-scroll-paper/60 rounded-2xl p-5 border border-ink-black/15">
          <label className="block text-sm font-medium text-ink-black mb-2">笑话内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="挥毫落纸，妙趣横生..."
            rows={5}
            className="w-full bg-mist-white/50 border border-ink-black/20 rounded-xl px-4 py-3 focus:outline-none focus:border-persimmon focus:ring-1 focus:ring-persimmon/30 resize-none font-serif text-lg"
            required
            minLength={5}
            maxLength={500}
          />
          <p className="text-xs text-ink-black/40 mt-2 text-right">{content.length}/500 字符</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-600 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || content.length < 5}
          className="w-full bg-sunset-glow text-white py-4 rounded-xl font-medium text-lg shadow-scroll hover:shadow-scroll-hover transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? '发布中...' : '发布笑话'}
        </button>
      </form>
    </div>
  );
}
