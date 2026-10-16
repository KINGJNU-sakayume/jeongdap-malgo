// 설정. 기록과 따로 jdm:v1:settings에 둔다(CLAUDE.md 규칙 8, D-004).
// localStorage 접근은 전부 try/catch. 실패하면 메모리에서만 유지.
import { defaultStorage, type StorageLike } from '../log/storage';

export const SETTINGS_KEY = 'jdm:v1:settings';

export interface Settings {
  muted: boolean;
}

const DEFAULTS: Settings = { muted: false };

export function parseSettings(raw: string | null): Settings {
  if (raw === null) return DEFAULTS;
  try {
    const v: unknown = JSON.parse(raw);
    if (v && typeof v === 'object' && typeof (v as Settings).muted === 'boolean') return { muted: (v as Settings).muted };
  } catch {
    /* 깨진 값은 기본값 */
  }
  return DEFAULTS;
}

export function createSettingsStore(storage: StorageLike | null = defaultStorage()) {
  let cur: Settings = DEFAULTS;
  try {
    cur = parseSettings(storage?.getItem(SETTINGS_KEY) ?? null);
  } catch {
    cur = DEFAULTS;
  }
  const subs = new Set<() => void>();
  return {
    get: (): Settings => cur,
    set(patch: Partial<Settings>) {
      cur = { ...cur, ...patch };
      try {
        storage?.setItem(SETTINGS_KEY, JSON.stringify(cur));
      } catch {
        /* 메모리에서만 유지 */
      }
      subs.forEach((f) => f());
    },
    subscribe(f: () => void) {
      subs.add(f);
      return () => void subs.delete(f);
    },
  };
}

/** 앱 전체에서 하나. */
export const settings = createSettingsStore();
