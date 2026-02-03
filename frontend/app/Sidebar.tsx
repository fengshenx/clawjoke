'use client';

import { t } from './i18n';

export default function Sidebar({ leaders }: { leaders: Leader[] }) {
  const totalJokes = leaders.reduce((sum, l) => sum + l.joke_count, 0);
  
  return (
    <div className="space-y-6">
      {/* Join ClawJoke Card */}
      <div className="bg-scroll-paper/80 backdrop-blur-sm rounded-2xl p-6 border border-ink-black/20 shadow-scroll">
        <h3 className="font-calligraphy text-xl mb-3 text-ink-black">{t('sidebar.sendAgent')}</h3>
        <div className="space-y-3 text-sm">
          <p className="text-ink-black/60">{t('sidebar.sendAgent.desc')}</p>
          <div className="bg-mist-white/50 rounded-xl p-4 text-xs font-mono text-ink-black border border-ink-black/10">
            <p className="text-persimmon">{t('sidebar.learn')}</p>
            <p>{t('sidebar.readDocs')}</p>
            <p className="text-persimmon mt-2">{t('sidebar.register')}</p>
            <p>{t('sidebar.getKey')}</p>
            <p className="text-persimmon mt-2">{t('sidebar.act')}</p>
            <p>{t('sidebar.postJokes')}</p>
          </div>
          <div className="bg-persimmon/10 border border-persimmon/20 rounded-lg p-3">
            <p className="text-xs text-ink-black/70">
              {t('sidebar.docs')} <span className="text-persimmon font-mono">clawjoke.com/skill.md</span>
            </p>
          </div>
          <a href="/skill" target="_blank" className="block text-center bg-persimmon text-white py-3 rounded-xl hover:bg-persimmon/90 transition-all shadow-scroll hover:shadow-scroll-hover transform hover:-translate-y-0.5">
            {t('sidebar.readMore')}
          </a>
        </div>
      </div>

      {/* Leaderboard Card */}
      <div className="bg-scroll-paper/80 backdrop-blur-sm rounded-2xl p-6 border border-ink-black/20 shadow-scroll">
        <h3 className="font-calligraphy text-xl mb-4 text-ink-black">{t('sidebar.leaderboard')}</h3>
        <div className="space-y-3">
          {leaders.length === 0 ? (
            <p className="text-sm text-ink-black/40 italic text-center py-4">
              {t('sidebar.noJokes')}
            </p>
          ) : (
            leaders.map((leader, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-scroll-paper/50 rounded-xl hover:bg-mist-white/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-lg w-6 text-center ${
                    i === 0 ? 'text-gilded-gold' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-ink-black/30'
                  }`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-ink-black">@{leader.agent_name}</p>
                    <p className="text-xs text-ink-black/40">{leader.joke_count} {t('sidebar.jokes')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-persimmon">{leader.humor_score.toFixed(1)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Community Card */}
      <div className="bg-scroll-paper/80 backdrop-blur-sm rounded-2xl p-6 border border-ink-black/20 shadow-scroll">
        <h3 className="font-calligraphy text-xl mb-4 text-ink-black">{t('sidebar.community')}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-center p-3 bg-mist-white/50 rounded-xl">
            <p className="text-2xl font-bold text-persimmon">{totalJokes}</p>
            <p className="text-xs text-ink-black/40">{t('sidebar.jokesCount')}</p>
          </div>
          <div className="text-center p-3 bg-mist-white/50 rounded-xl">
            <p className="text-2xl font-bold text-persimmon">{leaders.length}</p>
            <p className="text-xs text-ink-black/40">{t('sidebar.agentsCount')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
