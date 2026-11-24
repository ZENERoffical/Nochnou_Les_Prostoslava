import React from 'react';
import { Award, CheckCircle2, Lock, Sparkles, Trophy, X } from 'lucide-react';
import { ACHIEVEMENT_DEFS } from '../game/achievements';
import { getAchievementText, getUiText } from '../game/localization';
import { AchievementProgressState, GameLanguage } from '../types/game';

interface AchievementsModalProps {
  open: boolean;
  language: GameLanguage;
  state: AchievementProgressState;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  open,
  language,
  state,
  onClose,
}) => {
  if (!open) return null;

  const t = getUiText(language);
  const unlockedCount = state.unlockedIds.length;
  const totalCount = ACHIEVEMENT_DEFS.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 p-4">
      <div className="flex max-h-[88vh] w-full max-w-xl flex-col rounded-2xl border border-amber-400/45 bg-[#0a1319] p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/50 bg-amber-500/15 text-amber-300">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-wide text-white">
                {t.achievementsTitle}
              </h2>
              <p className="text-xs font-medium text-slate-400">
                {t.achievementsProgressHint}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-xs font-black tabular-nums text-amber-300">
              {unlockedCount}/{totalCount}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.closeSettings}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto pr-1">
          {ACHIEVEMENT_DEFS.map((def) => {
            const isUnlocked = state.unlockedIds.includes(def.id);
            const info = getAchievementText(def.id, language);
            const currentVal = def.statKey ? state[def.statKey] : 0;
            const targetVal = def.target ?? 0;
            const pct =
              targetVal > 0
                ? Math.min(100, Math.round((currentVal / targetVal) * 100))
                : isUnlocked
                  ? 100
                  : 0;

            return (
              <div
                key={def.id}
                className={`rounded-xl border p-3.5 transition-colors ${
                  isUnlocked
                    ? 'border-emerald-400/55 bg-emerald-950/35'
                    : 'border-white/10 bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                        isUnlocked
                          ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300'
                          : def.secret
                            ? 'border-rose-400/40 bg-rose-500/15 text-rose-300'
                            : 'border-white/15 bg-black/40 text-slate-400'
                      }`}
                    >
                      {isUnlocked ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : def.secret ? (
                        <Sparkles className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">
                        {info.title}
                      </div>
                      <div className="mt-0.5 text-xs font-medium text-slate-300">
                        {info.desc}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      isUnlocked
                        ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                        : 'border-white/15 bg-black/40 text-slate-400'
                    }`}
                  >
                    {isUnlocked ? t.unlockedLabel : t.lockedLabel}
                  </span>
                </div>

                {def.target !== undefined && (
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/60">
                      <div
                        className={`h-full transition-[width] duration-200 ${
                          isUnlocked ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold tabular-nums text-slate-300">
                      {Math.min(currentVal, targetVal)}/{targetVal}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 transition-colors cursor-pointer"
        >
          <Award className="h-4 w-4" />
          {t.closeSettings}
        </button>
      </div>
    </div>
  );
};
