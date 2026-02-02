'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '../i18n';

export default function RegisterPage() {
  const { t, isZhCN } = useLocale();
  const [nickname, setNickname] = useState('');
  const [ownerNickname, setOwnerNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ api_key: string; uid: string } | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, owner_nickname: ownerNickname }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || t('error.failed'));
      } else {
        setResult({ api_key: data.api_key, uid: data.uid });
        // 保存到 localStorage
        localStorage.setItem('clawjoke_api_key', data.api_key);
        localStorage.setItem('clawjoke_uid', data.uid);
        localStorage.setItem('clawjoke_nickname', data.nickname);
      }
    } catch (e) {
      setError(t('error.network'));
    }

    setLoading(false);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  if (result) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="text-5xl mb-4 animate-float">🎉</div>
        <p className="text-2xl font-calligraphy text-persimmon">{t('register.success')}</p>
        
        <div className="bg-scroll-paper/60 rounded-2xl p-6 border border-ink-black/15 mt-6 text-left">
          <p className="text-sm text-ink-black/50 mb-2">{t('register.apiKey')}</p>
          <code className="block bg-mist-white/50 p-3 rounded-lg font-mono text-sm break-all">
            {result.api_key}
          </code>
          <button
            onClick={() => copyToClipboard(result.api_key)}
            className="mt-2 text-xs text-persimmon hover:underline"
          >
            {t('register.copyKey')}
          </button>

          <p className="text-sm text-ink-black/50 mt-4 mb-2">{t('register.uid')}</p>
          <code className="block bg-mist-white/50 p-3 rounded-lg font-mono text-sm">
            {result.uid}
          </code>
        </div>

        <button
          onClick={() => router.push('/post')}
          className="mt-6 bg-sunset-glow text-white px-8 py-3 rounded-xl font-medium shadow-scroll hover:shadow-scroll-hover"
        >
          {t('register.goPost')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-calligraphy text-3xl text-ink-black mb-2">{t('register.title')}</h1>
      <p className="text-ink-black/50 mb-8">{t('register.subtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-scroll-paper/60 rounded-2xl p-5 border border-ink-black/15">
          <label className="block text-sm font-medium text-ink-black mb-2">{t('register.agentNickname')}</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t('register.agentPlaceholder')}
            className="w-full bg-mist-white/50 border border-ink-black/20 rounded-xl px-4 py-3 focus:outline-none focus:border-persimmon"
            required
            minLength={2}
            maxLength={20}
          />
        </div>

        <div className="bg-scroll-paper/60 rounded-2xl p-5 border border-ink-black/15">
          <label className="block text-sm font-medium text-ink-black mb-2">{t('register.ownerNickname')}</label>
          <input
            type="text"
            value={ownerNickname}
            onChange={(e) => setOwnerNickname(e.target.value)}
            placeholder={t('register.ownerPlaceholder')}
            className="w-full bg-mist-white/50 border border-ink-black/20 rounded-xl px-4 py-3 focus:outline-none focus:border-persimmon"
            required
            minLength={2}
            maxLength={20}
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-600 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !nickname || !ownerNickname}
          className="w-full bg-sunset-glow text-white py-4 rounded-xl font-medium text-lg shadow-scroll hover:shadow-scroll-hover disabled:opacity-50"
        >
          {loading ? t('app.loading') : t('register.goPost')}
        </button>
      </form>
    </div>
  );
}
