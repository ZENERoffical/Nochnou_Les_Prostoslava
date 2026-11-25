import {
  AchievementDef,
  AchievementId,
  AchievementProgressState,
  StoryActMode,
} from '../types/game';

const ACHIEVEMENTS_STORAGE_KEY = 'prostophilya_achievements_v1';

const STORY_ACT_MODES: StoryActMode[] = [
  'story_act1',
  'story_act2',
  'story_act3',
  'story_act4',
];

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: 'act1_clear' },
  { id: 'act2_clear' },
  { id: 'act3_malinka' },
  { id: 'act4_jojo' },
  { id: 'act4_shahediki', secret: true },
  { id: 'fnaf_50', statKey: 'totalFnafMivinas', target: 50 },
  { id: 'fnaf_100', statKey: 'totalFnafMivinas', target: 100 },
  { id: 'mush_50', statKey: 'totalMushrooms', target: 50 },
  { id: 'mush_100', statKey: 'totalMushrooms', target: 100 },
  { id: 'mush_200', statKey: 'totalMushrooms', target: 200 },
  { id: 'sniper_100', statKey: 'totalClonesKilled', target: 100 },
  { id: 'secret_malinka', secret: true },
  { id: 'act3_40_days' },
  { id: 'act3_99_days' },
  { id: 'parkour_clear' },
  { id: 'pvz_gardener' },
  { id: 'hardcore_all_acts' },
];

const VALID_IDS = new Set<AchievementId>(ACHIEVEMENT_DEFS.map((a) => a.id));
const VALID_STORY_MODES = new Set<StoryActMode>(STORY_ACT_MODES);

export function createEmptyAchievements(): AchievementProgressState {
  return {
    unlockedIds: [],
    totalMushrooms: 0,
    totalFnafMivinas: 0,
    totalClonesKilled: 0,
    hardcoreActsCleared: [],
  };
}

export function loadAchievements(): AchievementProgressState {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return createEmptyAchievements();
    const parsed = JSON.parse(raw) as Partial<AchievementProgressState>;
    const unlockedIds = Array.isArray(parsed.unlockedIds)
      ? parsed.unlockedIds.filter((id): id is AchievementId =>
          VALID_IDS.has(id as AchievementId)
        )
      : [];
    const hardcoreActsCleared = Array.isArray(parsed.hardcoreActsCleared)
      ? parsed.hardcoreActsCleared.filter((m): m is StoryActMode =>
          VALID_STORY_MODES.has(m as StoryActMode)
        )
      : [];
    return {
      unlockedIds: Array.from(new Set(unlockedIds)),
      totalMushrooms: Math.max(0, Math.floor(Number(parsed.totalMushrooms) || 0)),
      totalFnafMivinas: Math.max(0, Math.floor(Number(parsed.totalFnafMivinas) || 0)),
      totalClonesKilled: Math.max(0, Math.floor(Number(parsed.totalClonesKilled) || 0)),
      hardcoreActsCleared: Array.from(new Set(hardcoreActsCleared)),
    };
  } catch {
    return createEmptyAchievements();
  }
}

export function saveAchievements(state: AchievementProgressState): void {
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota or private mode failures
  }
}

export function unlockSingleAchievement(
  state: AchievementProgressState,
  id: AchievementId
): AchievementId[] {
  if (state.unlockedIds.includes(id)) return [];
  state.unlockedIds.push(id);
  saveAchievements(state);
  return [id];
}

export function recordHardcoreActClear(
  state: AchievementProgressState,
  actMode: StoryActMode
): AchievementId[] {
  if (!state.hardcoreActsCleared.includes(actMode)) {
    state.hardcoreActsCleared.push(actMode);
  }
  const allDone = STORY_ACT_MODES.every((m) => state.hardcoreActsCleared.includes(m));
  if (allDone && !state.unlockedIds.includes('hardcore_all_acts')) {
    state.unlockedIds.push('hardcore_all_acts');
    saveAchievements(state);
    return ['hardcore_all_acts'];
  }
  saveAchievements(state);
  return [];
}

export function evaluateStatAchievements(
  state: AchievementProgressState
): AchievementId[] {
  const newlyUnlocked: AchievementId[] = [];
  for (const def of ACHIEVEMENT_DEFS) {
    if (!def.statKey || def.target === undefined) continue;
    if (state.unlockedIds.includes(def.id)) continue;
    if (state[def.statKey] >= def.target) {
      state.unlockedIds.push(def.id);
      newlyUnlocked.push(def.id);
    }
  }
  saveAchievements(state);
  return newlyUnlocked;
}
