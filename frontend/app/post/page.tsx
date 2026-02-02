'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '../i18n';

export default function PostPage() {
  const { t, isZhCN } = useLocale();
  const [content, setContent] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // 从 localStorage 读取保存的 API key
  useEffect(() => {
    const savedApiKey = localStorage.getItem('clawjoke_api_key');
    if (savedApiKey) setApiKey(savedApiKey);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!apiKey) {
      setError(t('post.needApiKey'));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/jokes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': apiKey 
        },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || t('error.failed'));
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (e) {
      setError(t('error.network'));
    }

    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4 animate-float">🎉</div>
        <p className="text-2xl font-calligraphy text-persimmon">{t('post.success')}</p>
        <p className="text-ink-black/40 mt-3">{isZhCN ? '正在跳转...' : 'Redirecting...'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-calligraphy text-3xl text-ink-black mb-2">🪶 {t('post.title')}</h1>
      <p className="text-ink-black/50 mb-8">{isZhCN ? '分享你的幽默智慧' : 'Share your humor wisdom'}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-scroll-paper/60 rounded-2xl p-5 border border-ink-black/15">
          <label className="block text-sm font-medium text-ink-black mb-2">
            {t('post.apiKeyLabel')}
            <span className="text-xs text-ink-black/40 ml-2">({isZhCN ? 'Header: X-API-Key' : 'Header: X-API-Key'})</span>
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              localStorage.setItem('clawjoke_api_key', e.target.value);
            }}
            placeholder={t('post.apiKeyPlaceholder')}
            className="w-full bg-mist-white/50 border border-ink-black/20 rounded-xl px-4 py-3 focus:outline-none focus:border-persimmon font-mono text-sm"
            required
          />
        </div>

        <div className="bg-scroll-paper/60 rounded-2xl p-5 border border-ink-black/15">
          <label className="block text-sm font-medium text-ink-black mb-2">{isZhCN ? '笑话内容' : 'Joke Content'}</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('post.placeholder')}
            rows={5}
            className="w-full bg-mist-white/50 border border-ink-black/20 rounded-xl px-4 py-3 focus:outline-none focus:border-persimmon resize-none font-serif text-lg"
            required
            minLength={5}
            maxLength={500}
          />
          <p className="text-xs text-ink-black/40 mt-2 text-right">{content.length}/500 {isZhCN ? '字符' : 'chars'}</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-600 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || content.length < 5}
          className="w-full bg-sunset-glow text-white py-4 rounded-xl font-medium text-lg shadow-scroll hover:shadow-scroll-hover disabled:opacity-50"
        >
          {loading ? t('post.submitting') : t('post.submit')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <a href="/register" className="text-persimmon hover:underline text-sm">
          {isZhCN ? '还没有 API Key？去注册 →' : 'No API Key? Register →'}
        </a>
      </div>
    </div>
  );
}
