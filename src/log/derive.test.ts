import { describe, expect, it } from 'vitest';
import { currentRun, found, lastRepeatIndex, repeatBucket, repeatIndexAt } from './derive';
import { SAMPLE } from './__fixtures__/logs';

describe('기록 계산', () => {
  it('currentRun은 마지막 reset 이후만', () => {
    const run = currentRun(SAMPLE);
    expect(run).toHaveLength(2);
    expect(run[0]!.t).toBe('enter');
  });

  it('reset이 없으면 currentRun은 전체', () => {
    expect(currentRun(SAMPLE.slice(0, 5))).toHaveLength(5);
  });

  it('found는 누적이고 also와 이벤트를 포함한다', () => {
    const f = found(SAMPLE);
    for (const id of ['p02.hong', 'p02.empty', 'p02.ok', 'p12.clerk', 'p12.spam', 'p07.e-read']) {
      expect(f.has(id)).toBe(true);
    }
    expect(f.size).toBe(6);
  });

  it('repeatIndexAt은 주 결과 기준 누적 횟수', () => {
    expect(repeatIndexAt(SAMPLE, 1)).toBe(1); // 첫 홍길동
    expect(repeatIndexAt(SAMPLE, 2)).toBe(2); // 두 번째
    expect(repeatIndexAt(SAMPLE, 10)).toBe(3); // reset 뒤에도 이어 센다
    expect(repeatIndexAt(SAMPLE, 0)).toBe(0); // enter는 결과 없음
  });

  it('also로만 나온 결과는 반복으로 세지 않는다', () => {
    expect(repeatIndexAt(SAMPLE, 6)).toBe(1); // p12.clerk 1회, p12.spam은 also
  });

  it('범위 밖은 오류', () => {
    expect(() => repeatIndexAt(SAMPLE, 99)).toThrow();
  });

  it('lastRepeatIndex', () => {
    expect(lastRepeatIndex(SAMPLE)).toBe(3);
    expect(lastRepeatIndex([])).toBe(0);
  });

  it('repeatBucket은 1, 2, 3(이상)', () => {
    expect(repeatBucket(1)).toBe(1);
    expect(repeatBucket(2)).toBe(2);
    expect(repeatBucket(3)).toBe(3);
    expect(repeatBucket(7)).toBe(3);
  });
});
