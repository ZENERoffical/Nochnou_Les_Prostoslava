import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Crosshair,
  Crown,
  Eye,
  Factory,
  Flame,
  Footprints,
  Gamepad2,
  Link2,
  LogOut,
  Palette,
  Play,
  Sparkles,
  Sprout,
  Trees,
  Users,
  X,
} from 'lucide-react';
import { getUiText } from '../game/localization';
import {
  CharacterCustomization,
  GameLanguage,
  GameMode,
  PartyRoomState,
} from '../types/game';

interface PartyModalProps {
  open: boolean;
  language: GameLanguage;
  nickname: string;
  customization: CharacterCustomization;
  room: PartyRoomState | null;
  myMemberId: string | null;
  errorCode: string | null;
  initialJoinCode?: string;
  onCreateParty: (mode: GameMode, hardcoreMode: boolean, voidMode: boolean) => void;
  onJoinParty: (code: string) => void;
  onLeaveParty: () => void;
  onToggleReady: () => void;
  onSelectMode: (mode: GameMode, hardcoreMode: boolean, voidMode: boolean) => void;
  onLaunchParty: () => void;
  onOpenCustomizer: () => void;
  onClose: () => void;
}

export const PartyModal: React.FC<PartyModalProps> = ({
  open,
  language,
  nickname,
  customization,
  room,
  myMemberId,
  errorCode,
  initialJoinCode = '',
  onCreateParty,
  onJoinParty,
  onLeaveParty,
  onToggleReady,
  onSelectMode,
  onLaunchParty,
  onOpenCustomizer,
  onClose,
}) => {
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);
  const [defaultMode, setDefaultMode] = useState<GameMode>('story_act1');
  const [defaultHardcore, setDefaultHardcore] = useState(false);
  const [defaultVoid, setDefaultVoid] = useState(false);

  useEffect(() => {
    if (initialJoinCode) {
      setJoinCode(initialJoinCode.toUpperCase());
    }
  }, [initialJoinCode]);

  useEffect(() => {
    if (!copiedType) return;
    const timer = window.setTimeout(() => setCopiedType(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedType]);

  if (!open) return null;

  const t = getUiText(language);
  const isHost = Boolean(room && myMemberId && room.hostId === myMemberId);
  const me = room?.members.find((m) => m.id === myMemberId) ?? null;

  const errorMessage =
    errorCode === 'ROOM_NOT_FOUND'
      ? t.partyErrorNotFound
      : errorCode === 'ROOM_FULL'
        ? t.partyErrorFull
        : errorCode
          ? t.partyErrorConn
          : null;

  const allModes: Array<{
    id: GameMode;
    label: string;
    group: 'story' | 'minigames';
    icon: React.ReactNode;
  }> = [
    { id: 'story_act1', label: t.modeStory, group: 'story', icon: <BookOpen className="h-3.5 w-3.5 text-amber-300" /> },
    { id: 'story_act2', label: t.modeStory2, group: 'story', icon: <Factory className="h-3.5 w-3.5 text-sky-300" /> },
    { id: 'story_act3', label: t.modeStory3, group: 'story', icon: <Trees className="h-3.5 w-3.5 text-pink-300" /> },
    { id: 'story_act4', label: t.modeStory4, group: 'story', icon: <Sparkles className="h-3.5 w-3.5 text-purple-300" /> },
    { id: 'fnaf_epta', label: t.modeFnafTitle, group: 'minigames', icon: <Factory className="h-3.5 w-3.5 text-orange-300" /> },
    { id: 'sniper_minigame', label: t.modeSniperTitle, group: 'minigames', icon: <Crosshair className="h-3.5 w-3.5 text-lime-300" /> },
    { id: 'act3_survival', label: t.modeAct3SurvivalTitle, group: 'minigames', icon: <Trees className="h-3.5 w-3.5 text-teal-300" /> },
    { id: 'parkour_minigame', label: t.modeParkourTitle, group: 'minigames', icon: <Footprints className="h-3.5 w-3.5 text-cyan-300" /> },
    { id: 'plants_vs_roners', label: t.modePvzTitle, group: 'minigames', icon: <Sprout className="h-3.5 w-3.5 text-green-300" /> },
    { id: 'first_person', label: t.modeFP, group: 'minigames', icon: <Eye className="h-3.5 w-3.5 text-emerald-300" /> },
    { id: 'hardcore_third_person', label: t.modeHardcore, group: 'minigames', icon: <Flame className="h-3.5 w-3.5 text-rose-400" /> },
  ];

  const handleCopyCode = async () => {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.code);
      setCopiedType('code');
    } catch {
      // clipboard fallback ignored
    }
  };

  const handleCopyLink = async () => {
    if (!room) return;
    try {
      const url = `${window.location.origin}${window.location.pathname}?party=${room.code}`;
      await navigator.clipboard.writeText(url);
      setCopiedType('link');
    } catch {
      // clipboard fallback ignored
    }
  };

  const heroBadgeText = (c: CharacterCustomization) => {
    const mapOwner = (id: string) =>
      id === 'nikita' ? t.heroNikita : id === 'roner' ? t.heroRoner : id === 'sasha' ? t.heroSasha : t.heroNone;
    return `${mapOwner(c.head)} / ${mapOwner(c.torso)} / ${mapOwner(c.wings)}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-3 sm:p-4"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        } else {
          e.stopPropagation();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border-2 border-cyan-400/50 bg-[#0a1319] p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-black tracking-wide text-white">
              {t.partyTitle}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCustomizer}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-400/45 bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1.5 text-xs font-black text-emerald-200 transition-colors cursor-pointer"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>{t.customizeBtn}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.closeSettings}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-1 flex-col gap-3.5 overflow-y-auto pr-1">
          {errorMessage && (
            <div className="rounded-xl border border-rose-400/60 bg-rose-950/70 px-3.5 py-2 text-xs font-bold text-rose-200">
              {errorMessage}
            </div>
          )}

          {!room ? (
            <>
              {/* Profile preview strip */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {t.nicknameLabel}
                  </div>
                  <div className="text-sm font-black text-emerald-300">{nickname}</div>
                  <div className="text-[11px] font-semibold text-slate-300">
                    {heroBadgeText(customization)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenCustomizer}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-400/45 bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-2 text-xs font-black text-emerald-200 cursor-pointer"
                >
                  <Palette className="h-4 w-4" />
                  {t.customizeBtn}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Create Party */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-cyan-400/40 bg-cyan-500/10 p-4">
                  <div>
                    <div className="text-sm font-black text-cyan-200">
                      {t.partyCreateTitle}
                    </div>
                    <p className="mt-1 text-xs text-slate-300 leading-snug">
                      {t.partyCreateDesc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCreateParty(defaultMode, defaultHardcore, defaultVoid)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 py-2.5 text-sm font-black text-slate-950 transition-colors cursor-pointer"
                  >
                    <Users className="h-4 w-4" />
                    {t.partyCreateBtn}
                  </button>
                </div>

                {/* Join Party by Code */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4">
                  <div>
                    <div className="text-sm font-black text-emerald-200">
                      {t.partyJoinTitle}
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(
                          e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                        )
                      }
                      placeholder={t.partyCodePlaceholder}
                      className="mt-2 w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-center text-base font-black tracking-[0.25em] uppercase text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={joinCode.length < 4}
                    onClick={() => onJoinParty(joinCode)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-45 disabled:cursor-not-allowed py-2.5 text-sm font-black text-slate-950 transition-colors cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    {t.partyJoinBtn}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Room Invite Code Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border-2 border-cyan-400/50 bg-cyan-950/35 p-3.5">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                    {t.partyCodeLabel}
                  </div>
                  <div className="text-2xl font-black tracking-[0.28em] text-white tabular-nums">
                    {room.code}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 rounded-lg border border-cyan-400/45 bg-cyan-500/20 hover:bg-cyan-500/30 px-3 py-2 text-xs font-black text-cyan-100 cursor-pointer"
                  >
                    {copiedType === 'code' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiedType === 'code' ? t.partyCopied : t.partyCopyCode}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 px-3 py-2 text-xs font-black text-white cursor-pointer"
                  >
                    {copiedType === 'link' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                    ) : (
                      <Link2 className="h-3.5 w-3.5" />
                    )}
                    {copiedType === 'link' ? t.partyCopied : t.partyCopyLink}
                  </button>
                  <button
                    type="button"
                    onClick={onLeaveParty}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/15 hover:bg-rose-500/25 px-3 py-2 text-xs font-black text-rose-200 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {t.partyLeaveBtn}
                  </button>
                </div>
              </div>

              {/* Connected Members */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                  <span>
                    {t.partyMembersLabel} ({room.members.length}/8)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {room.members.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                        m.id === myMemberId
                          ? 'border-emerald-400/50 bg-emerald-500/10'
                          : 'border-white/10 bg-black/35'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {m.isHost && (
                            <Crown className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                          )}
                          <span className="truncate text-xs font-black text-white">
                            {m.name}
                          </span>
                        </div>
                        <div className="truncate text-[10px] font-semibold text-slate-400">
                          {heroBadgeText(m.customization)}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-black ${
                          m.isHost
                            ? 'bg-amber-500/25 text-amber-200'
                            : m.ready
                              ? 'bg-emerald-500/25 text-emerald-200'
                              : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {m.isHost
                          ? t.partyHostBadge
                          : m.ready
                            ? t.partyReadyBadge
                            : t.partyNotReadyBadge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mode Selection (Story Acts + Minigames) */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300">
                    <Gamepad2 className="h-4 w-4" />
                    <span>{t.partyModeSelectLabel}</span>
                  </div>
                  {!isHost && (
                    <span className="text-[11px] font-bold text-slate-400">
                      {t.partyHostOnlyHint}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {allModes.map((item) => {
                    const selected = room.mode === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!isHost}
                        onClick={() => {
                          setDefaultMode(item.id);
                          onSelectMode(item.id, room.hardcoreMode, room.voidMode);
                        }}
                        className={`flex items-center gap-1.5 rounded-lg border px-2 py-2 text-left text-xs font-extrabold transition-all ${
                          isHost ? 'cursor-pointer' : 'cursor-default opacity-85'
                        } ${
                          selected
                            ? 'border-amber-400 bg-amber-500/25 text-amber-100'
                            : 'border-white/10 bg-black/35 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Party Modifiers */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!isHost}
                    onClick={() => {
                      const nextHc = !room.hardcoreMode;
                      setDefaultHardcore(nextHc);
                      onSelectMode(room.mode, nextHc, room.voidMode);
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-black transition-all ${
                      isHost ? 'cursor-pointer' : 'cursor-default opacity-80'
                    } ${
                      room.hardcoreMode
                        ? 'border-rose-400 bg-rose-500/25 text-rose-200'
                        : 'border-white/10 bg-black/35 text-slate-300'
                    }`}
                  >
                    🔥 {t.hardcoreLabel}
                  </button>
                  <button
                    type="button"
                    disabled={!isHost}
                    onClick={() => {
                      const nextVoid = !room.voidMode;
                      setDefaultVoid(nextVoid);
                      onSelectMode(room.mode, room.hardcoreMode, nextVoid);
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-black transition-all ${
                      isHost ? 'cursor-pointer' : 'cursor-default opacity-80'
                    } ${
                      room.voidMode
                        ? 'border-purple-400 bg-purple-500/25 text-purple-200'
                        : 'border-white/10 bg-black/35 text-slate-300'
                    }`}
                  >
                    🌫️ {t.voidLabel}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {room && (
          <div className="mt-4 flex items-center gap-2 shrink-0">
            {isHost ? (
              <button
                type="button"
                onClick={onLaunchParty}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-black text-slate-950 transition-colors cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                {t.partyLaunchBtn}
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggleReady}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-colors cursor-pointer ${
                  me?.ready
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'border border-emerald-400 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                }`}
              >
                <Check className="h-4 w-4" />
                {t.partyToggleReady}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
