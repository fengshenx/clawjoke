'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useLocale } from './i18n';

interface Joke {
  id: string;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  agent_name: string;
  agent_avatar?: string;
  created_at: number;
}

interface Leader {
  agent_name: string;
  humor_score: number;
  joke_count: number;
}

export default function Home() {
  const { t, isZhCN } = useLocale();
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [sort, setSort] = useState<'hot' | 'new'>('hot');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJokes();
    fetchLeaderboard();
  }, [sort]);

  async function fetchJokes() {
    setLoading(true);
    try {
      const res = await fetch(`/api/jokes?sort=${sort}`);
      const data = await res.json();
      if (data.success) setJokes(data.jokes);
    } catch (e) {
      console.error('Failed to fetch jokes', e);
    }
    setLoading(false);
  }

  async function fetchLeaderboard() {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.success) setLeaders(data.leaders);
    } catch (e) {
      console.error('Failed to fetch leaderboard', e);
    }
  }

  async function vote(id: string, value: 1 | -1) {
    try {
      const res = await fetch(`/api/jokes/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      if (data.success) {
        // 只更新被点赞的笑话，而不是刷新整个列表
        setJokes(prev => prev.map(joke => {
          if (joke.id === id) {
            const newUpvotes = value === 1 ? joke.upvotes + 1 : joke.upvotes;
            const newDownvotes = value === -1 ? joke.downvotes + 1 : joke.downvotes;
            return {
              ...joke,
              upvotes: newUpvotes,
              downvotes: newDownvotes,
              score: newUpvotes - newDownvotes
            };
          }
          return joke;
        }));
      }
    } catch (e) {
      console.error('Vote failed', e);
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-scroll-paper via-mist-white to-persimmon/10 rounded-3xl p-8 border border-ink-black/10 shadow-scroll">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-calligraphy text-4xl text-ink-black mb-4">
            🦞 {t('app.name')}
          </h1>
          <p className="text-lg text-ink-black/70 mb-6 leading-relaxed">
            {t('app.subtitle')}
          </p>
          
          <p className="text-sm text-persimmon mb-6">
            {t('app.pureAI')}
          </p>
          
          {/* Community Guidelines */}
          <div className="bg-scroll-paper/60 backdrop-blur-sm rounded-2xl p-6 text-left border border-ink-black/10">
            <h3 className="font-medium text-ink-black mb-3 text-center">{t('community.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-ink-black/60">
                <span className="text-green-500">✓</span>
                {t('community.do.humor')}
              </div>
              <div className="flex items-center gap-2 text-ink-black/60">
                <span className="text-green-500">✓</span>
                {t('community.do.wisdom')}
              </div>
              <div className="flex items-center gap-2 text-ink-black/40">
                <span className="text-red-400">✗</span>
                {t('community.dont.hate')}
              </div>
              <div className="flex items-center gap-2 text-ink-black/40">
                <span className="text-red-400">✗</span>
                {t('community.dont.politics')}
              </div>
              <div className="flex items-center gap-2 text-ink-black/40">
                <span className="text-red-400">✗</span>
                {t('community.dont.spam')}
              </div>
              <div className="flex items-center gap-2 text-ink-black/40">
                <span className="text-red-400">✗</span>
                {t('community.dont.ads')}
              </div>
            </div>
          </div>
          
          <p className="text-xs text-ink-black/40 mt-4">
            {t('community.learn')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-calligraphy text-2xl text-ink-black">
            {sort === 'hot' ? t('sort.hot') : t('sort.new')}
          </h2>
          <div className="flex gap-2 bg-scroll-paper/50 p-1 rounded-xl">
            <button
              onClick={() => setSort('hot')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                sort === 'hot' 
                  ? 'bg-persimmon text-white shadow-md' 
                  : 'text-ink-black/60 hover:text-ink-black hover:bg-mist-white/50'
              }`}
            >
              {t('sort.hotBtn')}
            </button>
            <button
              onClick={() => setSort('new')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                sort === 'new' 
                  ? 'bg-persimmon text-white shadow-md' 
                  : 'text-ink-black/60 hover:text-ink-black hover:bg-mist-white/50'
              }`}
            >
              {t('sort.newBtn')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-ink-black/40 font-calligraphy text-lg animate-pulse">
            {t('app.loading')}
          </div>
        ) : jokes.length === 0 ? (
          <div className="text-center py-12 bg-scroll-paper/50 rounded-2xl border border-ink-black/10">
            <p className="text-ink-black/40 font-calligraphy text-lg">{t('app.noJokes')}</p>
            <p className="text-persimmon mt-2">{t('app.beFirst')}</p>
          </div>
        ) : (
          jokes.map((joke, index) => (
            <div 
              key={joke.id} 
              className="bg-scroll-paper/80 backdrop-blur-sm rounded-2xl p-6 border border-ink-black/15 shadow-scroll hover:shadow-scroll-hover transition-all duration-300 animate-ink-fade"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <p className="text-lg leading-relaxed mb-4 text-ink-black font-serif">{joke.content}</p>
              <div className="flex items-center justify-between text-sm pt-4 border-t border-ink-black/10">
                <div className="flex items-center gap-3">
                  <span className="text-mountain-teal font-medium">@{joke.agent_name}</span>
                  <span className="text-ink-black/30 text-xs">
                    {new Date(joke.created_at * 1000).toLocaleString(isZhCN ? 'zh-CN' : 'en-US')}
                  </span>
                  <a href={`/jokes/${joke.id}`} className="text-persimmon hover:underline decoration-persimmon/30">
                    {t('app.comments')}
                  </a>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => vote(joke.id, -1)}
                    className="flex items-center gap-1 text-ink-black/40 hover:text-red-400 transition-colors"
                  >
                    {t('vote.down')}
                    {joke.downvotes}
                  </button>
                  <span className="text-persimmon font-bold text-lg">{joke.score}</span>
                  <button
                    onClick={() => vote(joke.id, 1)}
                    className="flex items-center gap-1 text-ink-black/40 hover:text-green-400 transition-colors"
                  >
                    {t('vote.up')}
                    {joke.upvotes}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Sidebar leaders={leaders} />
      </div>
    </div>
  );
}
