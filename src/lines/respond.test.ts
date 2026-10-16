import { describe, expect, it } from 'vitest';
import type { OutcomeClass } from '../engine/types';
import { submit } from '../log/__fixtures__/logs';
import type { StageOptions } from '../log/stage';
import { parseLines } from './parser';
import { respond } from './respond';
import { makeBook } from './select';

const book = makeBook(
  parseLines(
    `## @stage-up.1

전환.

## p02.hong

기본 {name}.

@stage 1-5
지침.

## p02.empty

빈칸.`,
    't.md',
  ).sets,
);
const classOf = (id: string): OutcomeClass | undefined => (id.endsWith('.ok') ? 'correct' : 'wrong');
const O: StageOptions = { classOf, thresholds: [2], cap: 5, coolStreak: 3 };
const base = { book, stageOptions: O, forcedStage: null, name: null, repeat: 1 };
const texts = (r: ReturnType<typeof respond>) => r.beats.map((b) => b.text);

describe('respond', () => {
  it('단계가 처음 오르면 전환 대사를 먼저', () => {
    const r = respond({ ...base, log: [submit('p02.empty'), submit('p02.hong')], lineId: 'p02.hong' });
    expect(r.stageUp).toBe(1);
    expect(texts(r)).toEqual(['전환.', '지침.']);
  });

  it('단계가 그대로면 전환 대사 없음, {name}은 선생님', () => {
    const r = respond({ ...base, log: [submit('p02.hong')], lineId: 'p02.hong' });
    expect(r.stageUp).toBeNull();
    expect(texts(r)).toEqual(['기본 선생님.']);
  });

  it('단계 강제 중에는 강제 단계로 고르고 전환 대사를 끼우지 않는다', () => {
    const r = respond({ ...base, log: [submit('p02.empty'), submit('p02.hong')], lineId: 'p02.hong', forcedStage: 0, name: '김민지' });
    expect(r.stage).toBe(0);
    expect(texts(r)).toEqual(['기본 김민지.']);
  });

  it('대사가 없으면 미작성 표시', () => {
    const r = respond({ ...base, log: [submit('p02.robot')], lineId: 'p02.robot' });
    expect(texts(r)).toEqual(['[대사 미작성: p02.robot]']);
  });
});
