import { CharacterCustomization, HeroPartOwner } from '../types/game';

const CUSTOMIZATION_KEY = 'prostophilya_custom_char_v1';
const NICKNAME_KEY = 'prostophilya_mp_nick_v1';

export const DEFAULT_CHARACTER_CUSTOMIZATION: CharacterCustomization = {
  head: 'nikita',
  hat: 'nikita',
  torso: 'nikita',
  wings: 'nikita',
  legs: 'nikita',
};

const VALID_OWNERS: ReadonlySet<HeroPartOwner> = new Set(['nikita', 'roner', 'sasha']);

export function sanitizeCustomization(raw: unknown): CharacterCustomization {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_CHARACTER_CUSTOMIZATION };
  }
  const obj = raw as Record<string, unknown>;
  const pickOwner = (val: unknown, fallback: HeroPartOwner): HeroPartOwner =>
    typeof val === 'string' && VALID_OWNERS.has(val as HeroPartOwner)
      ? (val as HeroPartOwner)
      : fallback;

  const hatVal =
    obj.hat === 'none'
      ? 'none'
      : pickOwner(obj.hat, DEFAULT_CHARACTER_CUSTOMIZATION.hat as HeroPartOwner);

  return {
    head: pickOwner(obj.head, 'nikita'),
    hat: hatVal,
    torso: pickOwner(obj.torso, 'nikita'),
    wings: pickOwner(obj.wings, 'nikita'),
    legs: pickOwner(obj.legs, 'nikita'),
  };
}

export function loadCustomization(): CharacterCustomization {
  try {
    const raw = localStorage.getItem(CUSTOMIZATION_KEY);
    if (!raw) return { ...DEFAULT_CHARACTER_CUSTOMIZATION };
    return sanitizeCustomization(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_CHARACTER_CUSTOMIZATION };
  }
}

export function saveCustomization(custom: CharacterCustomization): void {
  try {
    localStorage.setItem(CUSTOMIZATION_KEY, JSON.stringify(sanitizeCustomization(custom)));
  } catch {
    // ignore storage errors
  }
}

export function sanitizeNickname(raw: unknown): string {
  if (typeof raw !== 'string') return 'nikitys6666';
  const cleaned = raw.replace(/[\u0000-\u001F\u007F<>]/g, '').trim().slice(0, 18);
  return cleaned.length > 0 ? cleaned : 'nikitys6666';
}

export function loadNickname(): string {
  try {
    const raw = localStorage.getItem(NICKNAME_KEY);
    return raw ? sanitizeNickname(raw) : 'nikitys6666';
  } catch {
    return 'nikitys6666';
  }
}

export function saveNickname(name: string): void {
  try {
    localStorage.setItem(NICKNAME_KEY, sanitizeNickname(name));
  } catch {
    // ignore storage errors
  }
}

export function makeHeroPreset(hero: HeroPartOwner): CharacterCustomization {
  return {
    head: hero,
    hat: hero,
    torso: hero,
    wings: hero,
    legs: hero,
  };
}
