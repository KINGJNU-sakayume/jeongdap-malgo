import { describe, expect, it } from 'vitest';
import { createLogStore, LOG_BACKUP_KEY, LOG_KEY, memoryStorage, parseLog, type StorageLike } from './storage';
import { SAMPLE, submit } from './__fixtures__/logs';

describe('기록 저장소', () => {
  it('빈 저장소에서 시작하면 빈 기록', () => {
    const store = createLogStore(memoryStorage());
    expect(store.read()).toEqual([]);
    expect(store.persistent).toBe(true);
  });

  it('덧붙인 항목이 저장되고 다시 읽힌다', () => {
    const mem = memoryStorage();
    const a = createLogStore(mem);
    a.append(SAMPLE[0]!);
    a.append(SAMPLE[1]!);
    const b = createLogStore(mem);
    expect(b.read()).toEqual([SAMPLE[0], SAMPLE[1]]);
    expect(JSON.parse(mem.dump()[LOG_KEY]!)).toHaveLength(2);
  });

  it('깨진 JSON은 백업하고 새로 시작한다', () => {
    const mem = memoryStorage({ [LOG_KEY]: '{깨짐' });
    const store = createLogStore(mem);
    expect(store.read()).toEqual([]);
    expect(mem.dump()[LOG_BACKUP_KEY]).toBe('{깨짐');
  });

  it('배열이 아니면 깨진 것으로 본다', () => {
    expect(parseLog('{"t":"reset"}')).toBeNull();
  });

  it('이상한 항목만 버리고 나머지는 살린다', () => {
    const raw = JSON.stringify([SAMPLE[1], { t: 'submit', at: 1 }, { t: '???', at: 2 }, SAMPLE[2]]);
    expect(parseLog(raw)).toEqual([SAMPLE[1], SAMPLE[2]]);
  });

  it('읽을 때 결과 ID 이름 바꾸기를 적용한다(연쇄 포함)', () => {
    const raw = JSON.stringify([submit('p02.old', ['p02.older'])]);
    const log = parseLog(raw, { 'p02.old': 'p02.mid', 'p02.mid': 'p02.new', 'p02.older': 'p02.newer' });
    const e = log![0]!;
    expect(e.t === 'submit' && e.outcome).toBe('p02.new');
    expect(e.t === 'submit' && e.also).toEqual(['p02.newer']);
  });

  it('이름 바꾸기 표가 순환해도 멈춘다', () => {
    const log = parseLog(JSON.stringify([submit('p02.a')]), { 'p02.a': 'p02.b', 'p02.b': 'p02.a' });
    expect(log).toHaveLength(1);
  });

  it('저장소가 없으면 메모리로 계속 간다', () => {
    const store = createLogStore(null);
    store.append(SAMPLE[0]!);
    expect(store.read()).toHaveLength(1);
    expect(store.persistent).toBe(false);
  });

  it('쓰기가 실패해도 메모리 기록은 유지된다', () => {
    const broken: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceeded');
      },
      removeItem: () => {},
    };
    const store = createLogStore(broken);
    store.append(SAMPLE[0]!);
    store.append(SAMPLE[1]!);
    expect(store.read()).toHaveLength(2);
    expect(store.persistent).toBe(false);
  });

  it('읽기가 실패해도 시작은 된다', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {},
      removeItem: () => {},
    };
    const store = createLogStore(broken);
    expect(store.read()).toEqual([]);
  });

  it('clear는 기록을 지운다', () => {
    const mem = memoryStorage();
    const store = createLogStore(mem);
    store.append(SAMPLE[0]!);
    store.clear();
    expect(store.read()).toEqual([]);
    expect(mem.dump()[LOG_KEY]).toBeUndefined();
  });
});
