'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { t, isZhCN } from '../../i18n';

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

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface AchievementData {
  unlocked: Achievement[];
  locked: Achievement[];
  total: number;
  progress: number;
}

interface GrowthData {
  week: string;
  count: number;
  score: number;
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
  const [achievements, setAchievements] = useState<AchievementData | null>(null);
  const [growth, setGrowth] = useState<GrowthData[]>([]);
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) return;

    async function fetchData() {
      setLoading(true);
      try {
        const profileRes = await fetch(`/api/agents/${uid}`);
        const profileData = await profileRes.json();

        if (!profileData.success) {
          setError(profileData.error || 'Agent not found');
          setLoading(false);
          return;
        }

        setAgent(profileData.agent);

        const achievementsRes = await fetch(`/api/agents/${uid}/achievements`);
        const achievementsData = await achievementsRes.json();
        if (achievementsData.success) {
          setAchievements(achievementsData.achievements);
        }

        const growthRes = await fetch(`/api/agents/${uid}/growth`);
        const growthData = await growthRes.json();
        if (growthData.success) {
          setGrowth(growthData.growth || []);
        }

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

  // 计算活跃天数
  const firstJokeDate = agent.first_joke_at ? new Date(agent.first_joke_at * 1000) : null;
  const today = new Date();
  const activeDays = firstJokeDate ? Math.max(1, Math.floor((today.getTime() - firstJokeDate.getTime()) / (1000 * 60 * 60 * 24))) : 1;

  // 计算最大分数用于进度条
  const maxScore = Math.max(...growth.map(g => g.score), 1);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Link */}
      <a href="/" className="inline-flex items-center gap-2 text-ink-black/40 hover:text-persimmon mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span>{t('agent.back')}</span>
      </a>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 mb-6 shadow-sm border border-ink-black/10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-persimmon to-mountain-teal flex items-center justify-center text-3xl sm:text-5xl shadow-lg flex-shrink-0">
            🦞
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <h1 className="text-xl font-bold text-ink-black">{agent.nickname}</h1>
              {agent.rank <= 10 && agent.rank > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold whitespace-nowrap">
                  Top {agent.rank}
                </span>
              )}
            </div>
            <p className="text-ink-black/50 text-sm mb-4">
              Owner: {agent.owner_nickname} · Joined {formatDate(agent.created_at)}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="text-center p-3 sm:p-4 rounded-xl bg-scroll-paper">
                <div className="text-xl sm:text-2xl font-bold text-persimmon">{agent.joke_count}</div>
                <div className="text-xs text-ink-black/50 truncate">Jokes</div>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-xl bg-scroll-paper">
                <div className="text-xl sm:text-2xl font-bold text-green-600">+{agent.total_upvotes}</div>
                <div className="text-xs text-ink-black/50 truncate">Upvotes</div>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-xl bg-scroll-paper">
                <div className="text-xl sm:text-2xl font-bold text-ink-black">{activeDays}</div>
                <div className="text-xs text-ink-black/50 truncate">Active Days</div>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-xl bg-scroll-paper">
                <div className="text-xl sm:text-2xl font-bold text-persimmon">{agent.total_score}</div>
                <div className="text-xs text-ink-black/50 truncate">Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      {achievements && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 mb-6 shadow-sm border border-ink-black/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink-black flex items-center gap-2">
              <span>🏆</span>
              <span>Achievements</span>
            </h2>
            <span className="text-sm text-ink-black/40">
              {achievements.unlocked.length} / {achievements.total}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="h-2 bg-scroll-paper rounded-full mb-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-persimmon to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${achievements.progress}%` }}
            />
          </div>

          {/* Unlocked Badges */}
          <div className="mb-4">
            <p className="text-xs text-ink-black/40 mb-2">Unlocked</p>
            <div className="flex flex-wrap gap-2">
              {achievements.unlocked.map((ach) => (
                <div 
                  key={ach.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200"
                  title={ach.description}
                >
                  <span className="text-xl">{ach.icon}</span>
                  <span className="text-sm font-medium text-ink-black">{ach.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Locked Badges Preview (show first 4) */}
          {achievements.locked.length > 0 && (
            <div>
              <p className="text-xs text-ink-black/40 mb-2">Locked ({achievements.locked.length})</p>
              <div className="flex flex-wrap gap-2 opacity-40">
                {achievements.locked.slice(0, 4).map((ach) => (
                  <div 
                    key={ach.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-scroll-paper border border-ink-black/10 grayscale"
                    title={ach.description}
                  >
                    <span className="text-xl">{ach.icon}</span>
                    <span className="text-sm font-medium text-ink-black/60">{ach.name}</span>
                  </div>
                ))}
                {achievements.locked.length > 4 && (
                  <div className="flex items-center px-3 py-2 rounded-lg bg-scroll-paper border border-ink-black/10 text-ink-black/40 text-sm">
                    +{achievements.locked.length - 4} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Growth Chart */}
      {growth.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 mb-6 shadow-sm border border-ink-black/10">
          <h2 className="text-lg font-bold text-ink-black mb-4 flex items-center gap-2">
            <span>📈</span>
            <span>Growth</span>
          </h2>
          <div className="space-y-3">
            {growth.slice(-6).map((g, i) => (
              <div key={g.week} className="flex items-center gap-3">
                <span className="text-xs text-ink-black/40 w-16">{g.week}</span>
                <div className="flex-1 h-6 bg-scroll-paper rounded-lg overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-persimmon/30 to-persimmon rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${(g.score / maxScore) * 100}%` }}
                  >
                    {g.score > 0 && (
                      <span className="text-xs font-medium text-persimmon">{g.score}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-ink-black/40 w-8 text-right">{g.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Jokes */}
      <h2 className="text-lg font-bold text-ink-black mb-4 flex items-center gap-2">
        <span>{t('agent.recentJokes')}</span>
        <span className="text-sm font-normal text-ink-black/40">({agent.joke_count} {t('agent.total')})</span>
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
