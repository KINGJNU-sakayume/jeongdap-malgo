import { describe, expect, it } from 'vitest';
import type { Beat } from '../lines/types';
import { delayOf, start, tap, tick, visibleLines, type Playback, type Timing } from './beatPlayback';

const T: Timing = { firstDelayMs: 300, typeMsPerChar: 20, pauseMs: { short: 500, long: 1200 } };
const B: Beat[] = [
  { text: '가나', pause: 'long' },
  { text: '다', pause: 'short' },
];
const ticks = (p: Playback, n: number) => Array.from({ length: n }).reduce<Playback>((q) => tick(q), p);

describe('비트 출력', () => {
  it('첫 비트 전 대기, 글자 단위 타이핑, 정지, 다음 비트, 끝', () => {
    let p = start(B);
    expect(p.phase).toBe('wait');
    expect(delayOf(p, T)).toBe(300);
    expect(visibleLines(p)).toEqual([]);
    p = tick(p);
    expect(p.phase).toBe('typing');
    expect(delayOf(p, T)).toBe(20);
    p = tick(p);
    expect(visibleLines(p)).toEqual(['가']);
    p = tick(p);
    expect(p.phase).toBe('pause');
    expect(delayOf(p, T)).toBe(1200);
    p = ticks(p, 2);
    expect(p.phase).toBe('done');
    expect(visibleLines(p)).toEqual(['가나', '다']);
    expect(delayOf(p, T)).toBeNull();
  });

  it('탭 한 번에 현재 비트 완성, 두 번째에 다음 비트', () => {
    let p = tick(start(B)); // typing 0자
    p = tap(p);
    expect(p.phase).toBe('pause');
    expect(visibleLines(p)).toEqual(['가나']);
    p = tap(p);
    expect(p.phase).toBe('done');
    expect(visibleLines(p)).toEqual(['가나', '다']);
    expect(tap(p)).toBe(p);
  });

  it('대기 중 탭은 첫 비트를 바로 완성', () => {
    expect(visibleLines(tap(start(B)))).toEqual(['가나']);
  });

  it('비트가 없으면 바로 끝', () => {
    expect(start([]).phase).toBe('done');
  });
});
