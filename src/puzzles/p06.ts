// P06 서명. 정본: docs/puzzles/p06-signature.md
import type { Pt, Rect } from '../engine/helpers/geometry';
import { fractionIn, inkCoverage, inkLength, isStraightStroke } from '../engine/helpers/ink';
import type { PuzzleDef } from '../engine/types';
import { arc, dot, fill, straight, zigzag } from './__fixtures__/p06';

export interface P06State {
  /** 서식 좌표. 입력 시 0.005 간격으로 재표본화 */
  strokes: Pt[][];
  erases: number;
}

/** A 신청인 칸 */
export const P06_A: Rect = { x: 0.15, y: 0.9, w: 0.7, h: 0.18 };
/** C 담당자 칸 */
export const P06_C: Rect = { x: 0.15, y: 1.15, w: 0.7, h: 0.18 };
export const P06_STEP = 0.005;

/**
 * 판정 임계값(문서 값 그대로). D7 모바일 조정 대상.
 * 주의: 문서의 정답 예시 'A 안의 지그재그(L≈1.5)'는 coverage ≈ 0.65가 되어 filled로 간다. 보고 대상.
 */
export const P06_T = {
  filledCoverage: 0.6,
  dotL: 0.08,
  straightRatio: 0.95,
  straightMinL: 0.3,
  clerkFrac: 0.5,
  outsideFracA: 0.6,
  okFracA: 0.6,
  okL: 0.6,
  grid: { cols: 14, rows: 4, radius: 0.01 },
} as const;

/** 판정 파생값. 디버그 패널에서도 본다. */
export function p06Derived(s: P06State) {
  return {
    L: inkLength(s.strokes, P06_A.w),
    fracA: fractionIn(s.strokes, P06_A),
    fracC: fractionIn(s.strokes, P06_C),
    coverage: inkCoverage(s.strokes, P06_A, P06_T.grid.cols, P06_T.grid.rows, P06_T.grid.radius),
    straight: isStraightStroke(s.strokes, P06_A.w, P06_T.straightRatio, P06_T.straightMinL),
  };
}

const INITIAL: P06State = { strokes: [], erases: 0 };
const s = (...strokes: Pt[][]): P06State => ({ strokes, erases: 0 });
/** A 위쪽 여백 */
const ABOVE_A: Rect = { x: 0.15, y: 0.7, w: 0.7, h: 0.15 };

export const P06: PuzzleDef<P06State> = {
  id: 'p06-signature',
  prefix: 'p06',
  chapter: 2,
  title: '서명',
  instruction: '신청인 서명란에 서명하시오',
  verb: '서명하시오',
  initial: INITIAL,
  rules: [
    {
      outcome: 'p06.blank',
      kind: 'wrong',
      type: '방',
      when: (x) => x.strokes.length === 0,
      examples: [s()],
    },
    {
      outcome: 'p06.clerk',
      kind: 'wrong',
      type: '탈',
      when: (x) => p06Derived(x).fracC >= P06_T.clerkFrac,
      examples: [s(zigzag(P06_C)), s(fill(P06_C))],
    },
    {
      outcome: 'p06.filled',
      kind: 'wrong',
      type: '과',
      when: (x) => p06Derived(x).coverage >= P06_T.filledCoverage,
      examples: [s(fill(P06_A)), s(zigzag(P06_A, 8))],
    },
    {
      outcome: 'p06.dot',
      kind: 'wrong',
      type: '방',
      when: (x) => p06Derived(x).L < P06_T.dotL,
      examples: [s(dot(P06_A)), s([{ x: 0.5, y: 0.99 }])],
    },
    {
      outcome: 'p06.line',
      kind: 'wrong',
      type: '문',
      when: (x) => p06Derived(x).straight,
      // A 밖의 직선도 밑줄(충돌 메모)
      examples: [s(straight(P06_A)), s(straight(ABOVE_A))],
    },
    {
      outcome: 'p06.outside',
      kind: 'wrong',
      type: '실',
      when: (x) => p06Derived(x).fracA < P06_T.outsideFracA,
      examples: [s(zigzag(ABOVE_A))],
    },
    {
      outcome: 'p06.ok',
      kind: 'correct',
      when: (x) => {
        const d = p06Derived(x);
        return d.fracA >= P06_T.okFracA && d.L >= P06_T.okL;
      },
      // 문서 예시(L≈1.5 지그재그)는 현재 임계값에서 filled가 되므로 L≈1.0 지그재그로 둔다(보고함)
      examples: [s(zigzag(P06_A, 4)), s(zigzag(P06_A, 3, 0.2))],
      notExamples: [s(zigzag(P06_A, 8))],
    },
    {
      outcome: 'p06.other',
      kind: 'other',
      when: () => true,
      examples: [s(arc(P06_A, 0.067))],
    },
  ],
  events: [
    {
      outcome: 'p06.e-erase',
      when: (x) => x.erases >= 5,
      examples: [{ strokes: [], erases: 5 }],
      notExamples: [{ strokes: [], erases: 4 }],
    },
  ],
  achievements: {
    'p06.blank': { name: '백지 위임', desc: '서명 없이 제출함' },
    'p06.clerk': { name: '결재권자', desc: '담당자 서명란에 서명함' },
    'p06.filled': { name: '먹물', desc: '서명란을 잉크로 가득 채움' },
    'p06.dot': { name: '마침표', desc: '점 하나로 서명을 대신함' },
    'p06.line': { name: '밑줄', desc: '서명란에 밑줄을 그음' },
    'p06.outside': { name: '탈옥 서명', desc: '서명이 서명란 밖으로 나감' },
    'p06.e-erase': { name: '개명 고민', desc: '서명을 다섯 번 넘게 지우고 다시 씀' },
  },
};
