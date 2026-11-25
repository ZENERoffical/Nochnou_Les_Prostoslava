import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Crosshair,
  Eye,
  Factory,
  Flame,
  Footprints,
  Gamepad2,
  Palette,
  Play,
  Settings,
  Sparkles,
  Sprout,
  Trees,
  Trophy,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ACHIEVEMENT_DEFS } from '../game/achievements';
import { getUiText } from '../game/localization';
import { GameMode, GameSettings } from '../types/game';

interface TitleOverlayProps {
  mode: GameMode;
  settings: GameSettings;
  bestMushrooms: number;
  bestFnafMivinas: number;
  bestSniperKills: number;
  unlockedAchievements: number;
  muted: boolean;
  partyCode: string | null;
  partyMembersCount: number;
  onSelectMode: (mode: GameMode) => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
  onOpenParty: () => void;
  onOpenCustomizer: () => void;
  onStart: () => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  mode,
  settings,
  bestMushrooms,
  bestFnafMivinas,
  bestSniperKills,
  unlockedAchievements,
  muted,
  partyCode,
  partyMembersCount,
  onSelectMode,
  onToggleMute,
  onOpenSettings,
  onOpenAchievements,
  onOpenParty,
  onOpenCustomizer,
  onStart,
}) => {
  const t = getUiText(settings.language);
  const isStoryMode =
    mode === 'story_act1' ||
    mode === 'story_act2' ||
    mode === 'story_act3' ||
    mode === 'story_act4';
  const [activeTab, setActiveTab] = useState<'story' | 'minigames'>(
    isStoryMode ? 'story' : 'minigames'
  );

  useEffect(() => {
    setActiveTab(isStoryMode ? 'story' : 'minigames');
  }, [isStoryMode]);

  const handleSwitchTab = (tab: 'story' | 'minigames') => {
    setActiveTab(tab);
    if (tab === 'story' && !isStoryMode) {
      onSelectMode('story_act1');
    } else if (tab === 'minigames' && isStoryMode) {
      onSelectMode('fnaf_epta');
    }
  };

  const activeBest =
    mode === 'fnaf_epta'
      ? bestFnafMivinas
      : mode === 'sniper_minigame'
        ? bestSniperKills
        : bestMushrooms;

  const activeDesc =
    mode === 'story_act1'
      ? t.descStory
      : mode === 'story_act2'
        ? t.descStory2
        : mode === 'story_act3'
          ? t.descStory3
          : mode === 'story_act4'
            ? t.descStory4
            : mode === 'fnaf_epta'
              ? t.descFnaf
              : mode === 'sniper_minigame'
                ? t.descSniper
                : mode === 'act3_survival'
                  ? t.descAct3Survival
                  : mode === 'parkour_minigame'
                    ? t.descParkour
                    : mode === 'plants_vs_roners'
                      ? t.descPvz
                      : mode === 'first_person'
                        ? t.descFP
                        : t.descHardcore;

  const isCompact = settings.mobileMode;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-30 flex flex-col justify-between ${
        isCompact ? 'p-2 sm:p-3' : 'p-4 sm:p-7'
      }`}
    >
      {/* Top Bar: Settings & Party + Bespoke Inline SVG Title Lockup + Achievements & Mute */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={t.settingsBtn}
            title={t.settingsBtn}
            className={`pointer-events-auto flex items-center gap-1.5 rounded-xl border border-white/20 bg-[#0b141a]/92 px-3 text-xs font-extrabold text-white hover:bg-[#152430] transition-colors cursor-pointer whitespace-nowrap ${
              isCompact ? 'h-9' : 'h-11'
            }`}
          >
            <Settings className="h-4 w-4 text-emerald-300" />
            <span className="hidden sm:inline">{t.settingsBtn}</span>
          </button>

          <button
            type="button"
            onClick={onOpenParty}
            aria-label={t.partyBtn}
            title={t.partyBtn}
            className={`pointer-events-auto flex items-center gap-1.5 rounded-xl border px-3 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
              partyCode
                ? 'border-cyan-400/75 bg-cyan-950/90 text-cyan-200 hover:bg-cyan-900/90'
                : 'border-cyan-400/40 bg-[#0b141a]/92 text-cyan-200 hover:bg-[#152430]'
            } ${isCompact ? 'h-9' : 'h-11'}`}
          >
            <Users className="h-4 w-4 text-cyan-300" />
            <span className="hidden sm:inline">
              {partyCode ? `${partyCode} (${partyMembersCount}/8)` : t.partyBtn}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenCustomizer}
            aria-label={t.customizeBtn}
            title={t.customizeBtn}
            className={`pointer-events-auto flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-[#0b141a]/92 px-3 text-xs font-extrabold text-emerald-200 hover:bg-[#152430] transition-colors cursor-pointer whitespace-nowrap ${
              isCompact ? 'h-9' : 'h-11'
            }`}
          >
            <Palette className="h-4 w-4 text-emerald-300" />
            <span className="hidden md:inline">{t.customizeBtn}</span>
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <svg
            viewBox="0 0 640 124"
            className={`${
              isCompact ? 'w-[min(48vw,320px)]' : 'w-[min(78vw,520px)]'
            } h-auto drop-shadow-[0_6px_18px_rgba(0,0,0,0.85)]`}
            role="img"
            aria-label={`${t.titleTop}: ${t.titleBottom}`}
          >
            <defs>
              <linearGradient id="titleGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="55%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
            <text
              x="320"
              y="46"
              textAnchor="middle"
              fill="#ecfdf5"
              stroke="#052e16"
              strokeWidth="8"
              paintOrder="stroke"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="36"
              letterSpacing="3"
            >
              {t.titleTop}
            </text>
            <text
              x="320"
              y="102"
              textAnchor="middle"
              fill="url(#titleGold)"
              stroke="#1e1b18"
              strokeWidth="10"
              paintOrder="stroke"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="54"
              letterSpacing="2"
            >
              {t.titleBottom}
            </text>
          </svg>
          {!isCompact && (
            <div className="mt-1 rounded-lg border border-emerald-400/30 bg-[#071117]/88 px-3.5 py-1 text-xs sm:text-sm font-extrabold tracking-wide text-emerald-200 shadow-lg">
              {t.titleSubtitle}
            </div>
          )}
          {(settings.hardcoreMode ||
            settings.voidMode ||
            settings.mobileMode ||
            settings.autoAim) && (
            <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
              {settings.hardcoreMode && (
                <span className="rounded border border-rose-500/60 bg-rose-950/90 px-2 py-0.5 text-[10px] font-black text-rose-300">
                  {t.hardcoreActiveBadge}
                </span>
              )}
              {settings.voidMode && (
                <span className="rounded border border-purple-400/60 bg-purple-950/90 px-2 py-0.5 text-[10px] font-black text-purple-200">
                  {t.voidLabel}
                </span>
              )}
              {settings.mobileMode && (
                <span className="rounded border border-cyan-400/60 bg-cyan-950/90 px-2 py-0.5 text-[10px] font-black text-cyan-200">
                  {t.mobileModeLabel}
                </span>
              )}
              {settings.autoAim && (
                <span className="rounded border border-lime-400/60 bg-lime-950/90 px-2 py-0.5 text-[10px] font-black text-lime-200">
                  {t.autoAimActiveBadge}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenAchievements}
            aria-label={t.achievementsBtn}
            title={t.achievementsBtn}
            className={`pointer-events-auto flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-[#0b141a]/92 px-3 text-xs font-extrabold text-amber-200 hover:bg-[#19232c] transition-colors cursor-pointer whitespace-nowrap ${
              isCompact ? 'h-9' : 'h-11'
            }`}
          >
            <Trophy className="h-4 w-4 text-amber-300" />
            <span className="hidden sm:inline">{t.achievementsBtn}</span>
            <span className="tabular-nums text-amber-300">
              {unlockedAchievements}/{ACHIEVEMENT_DEFS.length}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? t.unmuteLabel : t.muteLabel}
            className={`pointer-events-auto flex items-center justify-center rounded-xl border border-white/20 bg-[#0b141a]/92 text-white hover:bg-[#152430] transition-colors cursor-pointer ${
              isCompact ? 'h-9 w-9' : 'h-11 w-11'
            }`}
          >
            {muted ? (
              <VolumeX className="h-5 w-5 text-rose-400" />
            ) : (
              <Volume2 className="h-5 w-5 text-emerald-300" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom Launch Panel */}
      <div
        className={`mx-auto flex flex-col items-center gap-2 w-full ${
          isCompact ? 'max-w-3xl' : 'max-w-2xl'
        }`}
      >
        <div
          className={`pointer-events-auto flex flex-col rounded-2xl border border-emerald-400/35 bg-[#0a1319]/94 shadow-2xl w-full ${
            isCompact ? 'max-h-[64vh] overflow-y-auto gap-2 p-2.5' : 'gap-3 p-4'
          }`}
        >
          {/* Primary Tabs: Story vs. Minigames */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/45 p-1">
            <button
              type="button"
              onClick={() => handleSwitchTab('story')}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-black transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'story'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>{t.tabStory}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('minigames')}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-black transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'minigames'
                  ? 'bg-emerald-400 text-slate-950 shadow'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Gamepad2 className="h-4 w-4" />
              <span>{t.tabMinigames}</span>
            </button>
          </div>

          {activeTab === 'story' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => onSelectMode('story_act1')}
                className={`flex flex-col items-center justify-center rounded-xl border px-2 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'story_act1'
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-inner'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                  <span>{t.modeStory}</span>
                </span>
                <span className="text-[10px] font-bold text-amber-300/80">
                  1000m · 40 {t.statMushrooms}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('story_act2')}
                className={`flex flex-col items-center justify-center rounded-xl border px-2 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'story_act2'
                    ? 'border-sky-400 bg-sky-500/20 text-sky-200 shadow-inner'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Factory className="h-3.5 w-3.5 shrink-0 text-sky-300" />
                  <span>{t.modeStory2}</span>
                </span>
                <span className="text-[10px] font-bold text-sky-300/80">
                  {t.modeAct2Sub}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('story_act3')}
                className={`flex flex-col items-center justify-center rounded-xl border px-2 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'story_act3'
                    ? 'border-pink-400 bg-pink-500/20 text-pink-200 shadow-inner'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Trees className="h-3.5 w-3.5 shrink-0 text-pink-300" />
                  <span>{t.modeStory3}</span>
                </span>
                <span className="text-[10px] font-bold text-pink-300/80">
                  {t.modeAct3Sub}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('story_act4')}
                className={`flex flex-col items-center justify-center rounded-xl border px-2 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'story_act4'
                    ? 'border-purple-400 bg-purple-500/25 text-purple-200 shadow-inner'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-purple-300" />
                  <span>{t.modeStory4}</span>
                </span>
                <span className="text-[10px] font-bold text-purple-300/80">
                  {t.modeAct4Sub}
                </span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => onSelectMode('fnaf_epta')}
                className={`flex flex-col items-center justify-center rounded-xl border px-2 py-1.5 sm:py-2 text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'fnaf_epta'
                    ? 'border-orange-400 bg-orange-500/20 text-orange-200 shadow-inner'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Factory className="h-3.5 w-3.5 shrink-0 text-orange-300" />
                  <span className="truncate">{t.modeFnafTitle}</span>
                </span>
                <span className="text-[10px] font-bold text-orange-300/80">
                  {t.modeFnafSub}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('sniper_minigame')}
                className={`flex flex-col items-center justify-center rounded-xl border px-2 py-1.5 sm:py-2 text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'sniper_minigame'
                    ? 'border-lime-400 bg-lime-500/20 text-lime-200 shadow-inner'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Crosshair className="h-3.5 w-3.5 shrink-0 text-lime-300" />
                  <span className="truncate">{t.modeSniperTitle}</span>
                </span>
                <span className="text-[10px] font-bold text-lime-300/80">
                  {t.modeSniperSub}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('act3_survival')}
                className={`flex flex-col items-center justify-center rounded-xl border px-2 py-1.5 sm:py-2 text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'act3_survival'
                    ? 'border-teal-400 bg-teal-500/20 text-teal-200 shadow-inner'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Trees className="h-3.5 w-3.5 shrink-0 text-teal-300" />
                  <span className="truncate">{t.modeAct3SurvivalTitle}</span>
                </span>
                <span className="text-[10px] font-bold text-teal-300/80">
                  {t.modeAct3SurvivalSub}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('parkour_minigame')}
                className={`flex flex-col items-center justify-center rounded-xl border px-2 py-1.5 sm:py-2 text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'parkour_minigame'
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 shadow-inner'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Footprints className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                  <span className="truncate">{t.modeParkourTitle}</span>
                </span>
                <span className="text-[10px] font-bold text-cyan-300/80">
                  {t.modeParkourSub}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('plants_vs_roners')}
                className={`flex flex-col items-center justify-center rounded-xl border px-2 py-1.5 sm:py-2 text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'plants_vs_roners'
                    ? 'border-green-400 bg-green-500/20 text-green-200 shadow-inner'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Sprout className="h-3.5 w-3.5 shrink-0 text-green-300" />
                  <span className="truncate">{t.modePvzTitle}</span>
                </span>
                <span className="text-[10px] font-bold text-green-300/80">
                  {t.modePvzSub}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('first_person')}
                className={`flex flex-col items-center justify-center rounded-xl border px-2 py-1.5 sm:py-2 text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'first_person'
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200 shadow-inner'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 shrink-0" />
                  <span>{t.modeFP}</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-300/80">
                  {t.endless}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('hardcore_third_person')}
                className={`flex flex-col items-center justify-center rounded-xl border px-2 py-1.5 sm:py-2 text-xs font-extrabold transition-all cursor-pointer col-span-2 sm:col-span-2 ${
                  mode === 'hardcore_third_person'
                    ? 'border-rose-400 bg-rose-500/25 text-rose-200 shadow-inner'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                  <span>{t.modeHardcore}</span>
                </span>
                <span className="text-[10px] font-bold text-rose-300/80">
                  {t.endless}
                </span>
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {!isCompact && (
              <div className="flex items-center gap-3 shrink-0">
                <img
                  src="/assets/aistudio/image_690f5407.png"
                  alt={t.mushroomName}
                  className="h-14 w-14 rounded-xl border-2 border-amber-400 object-cover"
                />
                <img
                  src="/assets/aistudio/image_c7a46977.png"
                  alt="Characters"
                  className="h-14 w-24 rounded-xl border border-white/20 object-cover"
                />
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-bold text-emerald-300">
                <span>
                  nikitys6666 · {t.record}:{' '}
                  <span className="tabular-nums text-amber-300">{activeBest}</span>
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1 leading-snug">
                {activeDesc}
              </div>
            </div>

            <button
              type="button"
              onClick={onStart}
              className={`flex items-center justify-center gap-2 rounded-xl px-6 ${
                isCompact ? 'py-2.5 text-sm' : 'py-3.5 text-base'
              } font-black text-slate-950 shadow-lg transition-all cursor-pointer shrink-0 w-full sm:w-auto active:scale-95 whitespace-nowrap ${
                mode === 'hardcore_third_person'
                  ? 'bg-rose-400 hover:bg-rose-300'
                  : mode === 'story_act2'
                    ? 'bg-sky-400 hover:bg-sky-300'
                    : mode === 'story_act3'
                      ? 'bg-pink-400 hover:bg-pink-300'
                      : mode === 'story_act4'
                        ? 'bg-purple-400 hover:bg-purple-300'
                        : mode === 'fnaf_epta'
                          ? 'bg-orange-400 hover:bg-orange-300'
                          : mode === 'sniper_minigame'
                            ? 'bg-lime-400 hover:bg-lime-300'
                            : mode === 'act3_survival'
                              ? 'bg-teal-400 hover:bg-teal-300'
                              : mode === 'parkour_minigame'
                                ? 'bg-cyan-400 hover:bg-cyan-300'
                                : mode === 'plants_vs_roners'
                                  ? 'bg-green-400 hover:bg-green-300'
                                  : mode === 'story_act1'
                                    ? 'bg-amber-400 hover:bg-amber-300'
                                    : 'bg-emerald-500 hover:bg-emerald-400'
              }`}
            >
              <Play className="h-5 w-5 fill-current" />
              {t.playBtn}
            </button>
          </div>
        </div>

        {!isCompact && (
          <div className="rounded-lg bg-[#0a1319]/90 border border-white/10 px-4 py-1 text-xs font-semibold text-slate-300 text-center">
            {t.controlsTitle}
          </div>
        )}
      </div>
    </div>
  );
};

