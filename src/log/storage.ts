// 기록 저장소. docs/spec/data-format.md 4-2, CLAUDE.md 아키텍처 규칙 7.
// - 키: jdm:v1:log
// - localStorage 접근은 전부 try/catch. 실패하면 메모리 기록으로 계속 간다.
// - 읽을 때 깨진 데이터는 원본을 .bak으로 남기고 새로 시작한다.

import { isLogEntry, type Log, type LogEntry } from './types';
import { OUTCOME_RENAMES, resolveRename } from '../storage/renames';

export const LOG_KEY = 'jdm:v1:log';
export const LOG_BACKUP_KEY = 'jdm:v1:log.bak';

/** localStorage와 같은 모양. 테스트에서는 가짜를 넣는다. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LogStore {
  /** 현재 기록(불변 배열). */
  read(): Log;
  /** 항목 하나를 덧붙이고 저장한다. 새 기록을 돌려준다. */
  append(entry: LogEntry): Log;
  /** 기록을 통째로 지운다(디버그용). 게임 안 '처음부터'는 reset 항목을 덧붙이는 것으로 한다. */
  clear(): Log;
  /** 마지막 저장이 실제 저장소에 쓰였는가. false면 메모리에서만 유지 중. */
  readonly persistent: boolean;
}

export function defaultStorage(): StorageLike | null {
  try {
    const s = globalThis.localStorage;
    if (!s) return null;
    const probe = '__jdm_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

function applyRenames(e: LogEntry, table: Readonly<Record<string, string>>): LogEntry {
  if (e.t === 'submit') {
    return { ...e, outcome: resolveRename(e.outcome, table), also: e.also.map((a) => resolveRename(a, table)) };
  }
  if (e.t === 'event') return { ...e, outcome: resolveRename(e.outcome, table) };
  return e;
}

/** 저장된 문자열을 기록으로 바꾼다. 깨졌으면 null. 개별 항목이 이상하면 그 항목만 버린다. */
export function parseLog(raw: string, renames: Readonly<Record<string, string>> = OUTCOME_RENAMES): Log | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(data)) return null;
  return data.filter(isLogEntry).map((e) => applyRenames(e, renames));
}

export function createLogStore(
  storage: StorageLike | null = defaultStorage(),
  renames: Readonly<Record<string, string>> = OUTCOME_RENAMES,
): LogStore {
  let log: Log = [];
  let persistent = storage !== null;

  if (storage) {
    try {
      const raw = storage.getItem(LOG_KEY);
      if (raw !== null) {
        const parsed = parseLog(raw, renames);
        if (parsed) {
          log = parsed;
        } else {
          try {
            storage.setItem(LOG_BACKUP_KEY, raw);
          } catch {
            /* 백업 실패는 무시 */
          }
          log = [];
        }
      }
    } catch {
      persistent = false;
    }
  }

  const save = () => {
    if (!storage) {
      persistent = false;
      return;
    }
    try {
      storage.setItem(LOG_KEY, JSON.stringify(log));
      persistent = true;
    } catch {
      persistent = false;
    }
  };

  return {
    read: () => log,
    append(entry) {
      log = [...log, entry];
      save();
      return log;
    },
    clear() {
      log = [];
      if (storage) {
        try {
          storage.removeItem(LOG_KEY);
        } catch {
          persistent = false;
        }
      }
      return log;
    },
    get persistent() {
      return persistent;
    },
  };
}

/** 테스트·디버그용 메모리 저장소. */
export function memoryStorage(initial: Record<string, string> = {}): StorageLike & { dump(): Record<string, string> } {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  };
}
