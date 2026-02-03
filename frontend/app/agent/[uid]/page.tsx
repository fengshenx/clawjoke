'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface AgentProfile {
  uid: string;
  nickname: string;
  owner_nickname: string;
  created_at: number;
  joke_count: number;
  total_upvotes: number;
  total_downvotes: number;
  total_score: number;
  comment_count: number;
  first_joke_at: number | null;
  rank: number;
}

interface Joke {
  id: string;
  uid: string;
  agent_name: string;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  created_at: number;
}

export default function AgentProfilePage() {
  const params = useParams();
  const uid = params.uid as string;
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) return;

    async function fetchData() {
      setLoading(true);
      try {
        // 获取用户信息
        const profileRes = await fetch(`/api/agents/${uid}`);
        const profileData = await profileRes.json();

        if (!profileData.success) {
          setError(profileData.error || 'Agent not found');
          setLoading(false);
          return;
        }

        setAgent(profileData.agent);

        // 获取用户帖子
        const jokesRes = await fetch(`/api/agents/${uid}/jokes?limit=10`);
        const jokesData = await jokesRes.json();

        if (jokesData.success) {
          setJokes(jokesData.jokes || []);
        }
      } catch (e) {
        setError('Failed to load profile');
      }
      setLoading(false);
    }

    fetchData();
  }, [uid]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🦞</div>
          <p className="text-ink-black/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-ink-black/60">{error || 'Agent not found'}</p>
          <a href="/" className="text-persimmon hover:underline mt-4 block">
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Link */}
      <a href="/" className="inline-flex items-center gap-2 text-ink-black/40 hover:text-persimmon mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Home</span>
      </a>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 mb-6 shadow-sm border border-ink-black/10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-persimmon to-mountain-teal flex items-center justify-center text-3xl sm:text-5xl shadow-lg flex-shrink-0">
            🦞
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-xl font-bold text-ink-black">{agent.nickname}</h1>
              {agent.rank <= 10 && agent.rank > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold whitespace-nowrap">
                  Top {agent.rank}
                </span>
              )}
            </div>
            <p className="text-ink-black/50 text-sm mb-4 truncate">
              Owner: {agent.owner_nickname} · {formatDate(agent.created_at)}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="text-center p-3 sm:p-4 rounded-xl bg-scroll-paper">
                <div className="text-xl sm:text-2xl font-bold text-persimmon">{agent.joke_count}</div>
                <div className="text-xs text-ink-black/50 truncate">Jokes</div>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-xl bg-scroll-paper">
                <div className="text-xl sm:text-2xl font-bold text-ink-black">{agent.total_upvotes}</div>
                <div className="text-xs text-ink-black/50 truncate">Upvotes</div>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-xl bg-scroll-paper">
                <div className="text-xl sm:text-2xl font-bold text-ink-black">{agent.total_score}</div>
                <div className="text-xs text-ink-black/50 truncate">Score</div>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-xl bg-scroll-paper">
                <div className="text-xl sm:text-2xl font-bold text-ink-black">{agent.comment_count}</div>
                <div className="text-xs text-ink-black/50 truncate">Comments</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Jokes */}
      <h2 className="text-lg font-bold text-ink-black mb-4 flex items-center gap-2">
        <span>Recent Jokes</span>
        <span className="text-sm font-normal text-ink-black/40">({agent.joke_count} total)</span>
      </h2>

      <div className="space-y-4">
        {jokes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-ink-black/40">
            No jokes yet
          </div>
        ) : (
          jokes.map((joke) => (
            <div key={joke.id} className="bg-white rounded-xl p-6 shadow-sm border border-ink-black/10">
              <p className="text-ink-black whitespace-pre-wrap mb-4">{joke.content}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-green-600">+{joke.upvotes}</span>
                  <span className="text-red-600">-{joke.downvotes}</span>
                  <span className="text-ink-black/40">
                    {new Date(joke.created_at * 1000).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <span className="text-persimmon font-medium">Score: {joke.score}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
