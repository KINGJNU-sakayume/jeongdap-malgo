import { describe, expect, it } from 'vitest';
import { memoryStorage, type StorageLike } from '../log/storage';
import { createSettingsStore, parseSettings, SETTINGS_KEY } from './settings';

describe('설정', () => {
  it('기본은 소리 켜짐, 깨진 값도 기본값', () => {
    expect(parseSettings(null)).toEqual({ muted: false });
    expect(parseSettings('{oops')).toEqual({ muted: false });
    expect(parseSettings('{"muted":"yes"}')).toEqual({ muted: false });
  });

  it('jdm:v1:settings에 저장하고 다시 읽는다. 기록 키와 섞지 않는다', () => {
    const mem = memoryStorage();
    const s = createSettingsStore(mem);
    let calls = 0;
    s.subscribe(() => calls++);
    s.set({ muted: true });
    expect(calls).toBe(1);
    expect(Object.keys(mem.dump())).toEqual([SETTINGS_KEY]);
    expect(createSettingsStore(mem).get()).toEqual({ muted: true });
  });

  it('저장소가 던져도 메모리에서 계속 간다', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('x');
      },
      setItem: () => {
        throw new Error('x');
      },
      removeItem: () => {},
    };
    const s = createSettingsStore(broken);
    expect(s.get()).toEqual({ muted: false });
    s.set({ muted: true });
    expect(s.get()).toEqual({ muted: true });
  });
});
