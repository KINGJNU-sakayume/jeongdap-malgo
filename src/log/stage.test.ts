import { describe, expect, it } from 'vitest';
import type { OutcomeClass } from '../engine/types';
import { currentStage, newStageReached, rawStage, stageTimeline, type StageOptions } from './stage';
import { event, reset, submit } from './__fixtures__/logs';
import type { LogEntry } from './types';

const classOf = (id: string): OutcomeClass | undefined => {
  if (id.includes('.e-')) return 'event';
  if (id.endsWith('.ok')) return 'correct';
  if (id.includes('.v-')) return 'variant';
  if (id.endsWith('.other')) return 'other';
  return 'wrong';
};
const O: StageOptions = { classOf, thresholds: [2, 5, 9, 14, 20], cap: 5, coolStreak: 3 };

describe('화자 단계', () => {
  it('rawStage는 넘은 임계값 개수', () => {
    expect(rawStage(0, O.thresholds)).toBe(0);
    expect(rawStage(1, O.thresholds)).toBe(0);
    expect(rawStage(2, O.thresholds)).toBe(1);
    expect(rawStage(19, O.thresholds)).toBe(4);
    expect(rawStage(99, O.thresholds)).toBe(5);
  });

  it('같은 틀림 반복은 단계를 올리지 않는다', () => {
    const log = [submit('p02.hong'), submit('p02.hong'), submit('p02.hong'), submit('p02.hong')];
    expect(currentStage(log, O)).toBe(0);
  });

  it('서로 다른 틀림과 이벤트, also가 단계를 올린다', () => {
    const log = [submit('p02.hong'), event('p07.e-read'), submit('p12.clerk', ['p12.spam', 'p12.other']), submit('p02.empty')];
    // hong, e-read, clerk, spam, empty = 5 (other 제외) → 2
    expect(currentStage(log, O)).toBe(2);
  });

  it('상한을 넘지 않는다', () => {
    const many = Array.from({ length: 30 }, (_, i) => submit(`p0${(i % 9) + 1}.w${i}`));
    expect(currentStage(many, O)).toBe(5);
    expect(currentStage(many, { ...O, cap: 2 })).toBe(2);
  });

  it('연속 정답 3개면 한 단계 낮게, 틀리면 바로 복귀', () => {
    const base = [submit('p02.a'), submit('p02.b'), submit('p02.c'), submit('p02.d'), submit('p02.e')]; // D=5 → 2
    expect(currentStage(base, O)).toBe(2);
    const cooled = [...base, submit('p02.ok'), submit('p04.ok'), submit('p07.v-all')];
    expect(currentStage(cooled, O)).toBe(1);
    expect(currentStage([...cooled, submit('p02.a')], O)).toBe(2);
  });

  it('식는 기준은 현재 회차(reset 후 다시 센다)', () => {
    const base = [submit('p02.a'), submit('p02.b'), submit('p02.c'), submit('p02.d'), submit('p02.e')];
    const log: LogEntry[] = [...base, submit('p02.ok'), submit('p02.ok'), reset(), submit('p02.ok')];
    expect(currentStage(log, O)).toBe(2); // reset으로 연속이 끊김
  });

  it('timeline 길이는 기록 길이', () => {
    const log = [submit('p02.a'), submit('p02.b')];
    expect(stageTimeline(log, O)).toEqual([0, 1]);
    expect(stageTimeline([], O)).toEqual([]);
  });

  it('newStageReached는 기록 전체에서 처음 닿은 단계만', () => {
    const l1 = [submit('p02.a'), submit('p02.b')];
    expect(newStageReached(l1, O)).toBe(1);
    const l2 = [...l1, submit('p02.b')];
    expect(newStageReached(l2, O)).toBeNull();
    // 식었다가(1→0) 다시 1이 되면 전환 대사 없음
    const l3 = [...l1, submit('p02.ok'), submit('p02.ok'), submit('p02.ok'), submit('p02.a')];
    expect(stageTimeline(l3, O)).toEqual([0, 1, 1, 1, 0, 1]);
    expect(newStageReached(l3, O)).toBeNull();
  });

  it('한 번에 두 칸 오르면 높은 단계', () => {
    const log = [submit('p02.a'), submit('p02.b', ['p02.c', 'p02.d', 'p02.e'])];
    expect(newStageReached(log, O)).toBe(2);
  });
});
