import { describe, expect, it } from 'vitest';
import { checkEvents, judge, outcomeClasses } from './judge';
import { validatePuzzle } from './validate';
import type { PuzzleDef } from './types';
import { PUZZLES } from '../puzzles';

// 가짜 퍼즐: 숫자 하나를 고르는 퍼즐.
interface N {
  n: number;
  taps: number;
}
const fake: PuzzleDef<N> = {
  id: 'p99-fake',
  prefix: 'p99',
  chapter: 1,
  title: '가짜',
  instruction: '3을 고르시오',
  verb: '고르시오',
  initial: { n: 0, taps: 0 },
  rules: [
    { outcome: 'p99.big', kind: 'wrong', type: '과', when: (s) => s.n > 100, examples: [{ n: 101, taps: 0 }] },
    { outcome: 'p99.odd', kind: 'wrong', type: '실', when: (s) => s.n % 2 === 1 && s.n !== 3, examples: [{ n: 5, taps: 0 }] },
    { outcome: 'p99.zero', kind: 'wrong', type: '방', when: (s) => s.n === 0, examples: [{ n: 0, taps: 0 }] },
    { outcome: 'p99.v-three', kind: 'variant', when: (s) => s.n === 3 && s.taps === 3, examples: [{ n: 3, taps: 3 }] },
    { outcome: 'p99.ok', kind: 'correct', when: (s) => s.n === 3, examples: [{ n: 3, taps: 1 }] },
    { outcome: 'p99.other', kind: 'other', when: () => true, examples: [{ n: 4, taps: 0 }] },
  ],
  events: [{ outcome: 'p99.e-tap', when: (s) => s.taps >= 10, examples: [{ n: 0, taps: 10 }], notExamples: [{ n: 0, taps: 9 }] }],
  achievements: {
    'p99.big': { name: '큰 수', desc: '너무 큰 수를 고름' },
    'p99.odd': { name: '홀수', desc: '3이 아닌 홀수를 고름' },
    'p99.zero': { name: '영', desc: '아무것도 안 고름' },
    'p99.v-three': { name: '세 번', desc: '세 번 눌러 3을 고름' },
    'p99.e-tap': { name: '연타', desc: '열 번 넘게 누름' },
  },
};

describe('판정기', () => {
  it('첫 일치가 주 결과, 나머지 일치는 also(other 제외)', () => {
    const j = judge(fake, { n: 101, taps: 0 }); // big이면서 odd
    expect(j.outcome).toBe('p99.big');
    expect(j.kind).toBe('wrong');
    expect(j.also).toEqual(['p99.odd']);
  });

  it('정답 변주가 정답보다 먼저', () => {
    expect(judge(fake, { n: 3, taps: 3 }).outcome).toBe('p99.v-three');
    expect(judge(fake, { n: 3, taps: 3 }).also).toEqual(['p99.ok']);
  });

  it('어디에도 안 맞으면 other', () => {
    expect(judge(fake, { n: 4, taps: 0 })).toEqual({ outcome: 'p99.other', kind: 'other', also: [] });
  });

  it('규칙이 예외를 던지면 그 규칙만 불일치', () => {
    const bad: PuzzleDef<N> = {
      ...fake,
      rules: [
        { outcome: 'p99.boom', kind: 'wrong', when: () => { throw new Error('x'); }, examples: [] },
        ...fake.rules,
      ],
    };
    expect(judge(bad, { n: 3, taps: 1 }).outcome).toBe('p99.ok');
  });

  it('other가 없어서 아무것도 안 맞으면 오류', () => {
    const noOther: PuzzleDef<N> = { ...fake, rules: fake.rules.slice(0, -1) };
    expect(() => judge(noOther, { n: 4, taps: 0 })).toThrow('other');
  });

  it('이벤트는 이미 터진 것을 빼고 돌려준다', () => {
    expect(checkEvents(fake, { n: 0, taps: 12 }, new Set())).toEqual(['p99.e-tap']);
    expect(checkEvents(fake, { n: 0, taps: 12 }, new Set(['p99.e-tap']))).toEqual([]);
  });

  it('outcomeClasses', () => {
    const c = outcomeClasses(fake);
    expect(c.get('p99.big')).toBe('wrong');
    expect(c.get('p99.e-tap')).toBe('event');
    expect(c.get('p99.other')).toBe('other');
  });
});

describe('자동 검사', () => {
  it('올바른 가짜 퍼즐은 오류가 없다', () => {
    expect(validatePuzzle(fake)).toEqual([]);
  });

  it('잘못된 예시, 형식, 업적 누락을 잡는다', () => {
    const broken: PuzzleDef<N> = {
      ...fake,
      rules: [
        { outcome: 'p99.big', kind: 'wrong', when: (s) => s.n > 100, examples: [{ n: 5, taps: 0 }] }, // 예시 틀림
        { outcome: 'p98.odd', kind: 'wrong', when: (s) => s.n % 2 === 1, examples: [] }, // 접두어 틀림, 예시 없음
        { outcome: 'p99.ok', kind: 'correct', when: (s) => s.n === 3, examples: [{ n: 3, taps: 0 }] },
      ], // other 없음, 틀림 수 부족
      events: [],
      achievements: { 'p99.ok': { name: 'x', desc: 'y' } }, // 정답에 업적, big 업적 없음
    };
    const errs = validatePuzzle(broken).join('\n');
    expect(errs).toContain("마지막 규칙이 kind: 'other'가 아님");
    expect(errs).toContain('p99.big 예시가');
    expect(errs).toContain('결과 ID 형식 위반: p98.odd');
    expect(errs).toContain('p98.odd: 예시 없음');
    expect(errs).toContain('틀림+이벤트가 2개');
    expect(errs).toContain('p99.big: 업적 이름/설명 없음');
    expect(errs).toContain('업적이 틀림·이벤트·변주가 아닌 결과에 붙음: p99.ok');
  });

  it('반례와 초기 상태 이벤트를 잡는다', () => {
    const broken: PuzzleDef<N> = {
      ...fake,
      initial: { n: 0, taps: 99 },
      rules: fake.rules.map((r) => (r.outcome === 'p99.zero' ? { ...r, notExamples: [{ n: 0, taps: 1 }] } : r)),
    };
    const errs = validatePuzzle(broken).join('\n');
    expect(errs).toContain('p99.zero 반례가');
    expect(errs).toContain('초기 상태에서 이벤트가 터짐');
  });

  for (const p of PUZZLES) {
    it(`구현된 퍼즐 ${p.id} 자동 검사 통과`, () => {
      expect(validatePuzzle(p)).toEqual([]);
    });
  }
});
