// P12 도장. 정본: docs/puzzles/p12-stamp.md
import { circleOverlapRatio, normAngle, type Rect } from '../engine/helpers/geometry';
import type { PuzzleDef } from '../engine/types';

export interface StampMark {
  x: number;
  y: number;
  /** 0, 45, …, 315 */
  rot: number;
}

export interface P12State {
  /** 서식 위 인영 */
  marks: StampMark[];
  /** 화자 아이콘에 찍은 횟수 */
  clerkMarks: number;
}

/** 확인란 B */
export const P12_B: Rect = { x: 0.62, y: 1.05, w: 0.22, h: 0.22 };
/** 찍힌 모양 반지름 */
export const P12_R = 0.08;

export type Place = 'in' | 'partial' | 'out';
export type Pose = 'upright' | 'upside' | 'tilt';

export function overlapOf(m: StampMark): number {
  return circleOverlapRatio(m, P12_R, P12_B);
}

export function placeOf(m: StampMark): Place {
  const o = overlapOf(m);
  return o >= 0.9 ? 'in' : o >= 0.2 ? 'partial' : 'out';
}

export function poseOf(m: StampMark): Pose {
  const a = normAngle(m.rot);
  if (a === 0) return 'upright';
  if (a === 135 || a === 180 || a === 225) return 'upside';
  return 'tilt';
}

const INITIAL: P12State = { marks: [], clerkMarks: 0 };
const C = { x: P12_B.x + P12_B.w / 2, y: P12_B.y + P12_B.h / 2 };
const m = (rot = 0, x = C.x, y = C.y): StampMark => ({ x, y, rot });
const s = (marks: StampMark[], clerkMarks = 0): P12State => ({ marks, clerkMarks });
/** 서식 왼쪽 위 */
const TOP_LEFT = { x: 0.15, y: 0.15 };
/** 칸 경계 걸침(왼쪽 변 위에 중심) */
const EDGE = { x: P12_B.x, y: C.y };

const some = (x: P12State, f: (k: StampMark) => boolean) => x.marks.some(f);

export const P12: PuzzleDef<P12State> = {
  id: 'p12-stamp',
  prefix: 'p12',
  chapter: 4,
  title: '도장',
  instruction: '확인란에 도장을 찍으시오',
  verb: '찍으시오',
  initial: INITIAL,
  rules: [
    {
      outcome: 'p12.triple',
      kind: 'wrong',
      type: '복합',
      when: (x) => x.marks.length >= 2 && some(x, (k) => poseOf(k) === 'upside') && some(x, (k) => placeOf(k) === 'out'),
      examples: [s([m(180, TOP_LEFT.x, TOP_LEFT.y), m(0)])],
    },
    {
      outcome: 'p12.spam',
      kind: 'wrong',
      type: '과',
      when: (x) => x.marks.length >= 10,
      examples: [s(Array.from({ length: 10 }, () => m(0)))],
      notExamples: [s(Array.from({ length: 9 }, () => m(0)))],
    },
    {
      outcome: 'p12.clerk',
      kind: 'wrong',
      type: '탈',
      when: (x) => x.clerkMarks >= 1,
      examples: [s([], 1), s([m(0)], 1)],
    },
    {
      outcome: 'p12.none',
      kind: 'wrong',
      type: '방',
      when: (x) => x.marks.length === 0,
      examples: [s([])],
    },
    {
      outcome: 'p12.upside',
      kind: 'wrong',
      type: '실',
      when: (x) => some(x, (k) => poseOf(k) === 'upside'),
      examples: [s([m(180)]), s([m(135)]), s([m(225)])],
    },
    {
      outcome: 'p12.out',
      kind: 'wrong',
      type: '실',
      when: (x) => x.marks.every((k) => placeOf(k) === 'out'),
      examples: [s([m(0, TOP_LEFT.x, TOP_LEFT.y)])],
    },
    {
      outcome: 'p12.partial',
      kind: 'wrong',
      type: '실',
      when: (x) => !some(x, (k) => placeOf(k) === 'in') && some(x, (k) => placeOf(k) === 'partial'),
      examples: [s([m(0, EDGE.x, EDGE.y)])],
    },
    {
      outcome: 'p12.tilt',
      kind: 'wrong',
      type: '실',
      when: (x) => some(x, (k) => poseOf(k) === 'tilt'),
      examples: [s([m(45)]), s([m(90)]), s([m(315)])],
    },
    {
      outcome: 'p12.double',
      kind: 'wrong',
      type: '과',
      when: (x) => x.marks.length >= 2 && x.marks.length <= 9,
      examples: [s([m(0), m(0)])],
    },
    {
      outcome: 'p12.ok',
      kind: 'correct',
      when: (x) => x.marks.length === 1 && placeOf(x.marks[0]!) === 'in' && poseOf(x.marks[0]!) === 'upright',
      examples: [s([m(0)]), s([m(360)])],
    },
    // 논리상 도달 불가.
    { outcome: 'p12.other', kind: 'other', when: () => true, examples: [] },
  ],
  achievements: {
    'p12.triple': { name: '삼관왕', desc: '하나·칸 안·바로 세움을 모두 어김' },
    'p12.spam': { name: '확신', desc: '확인란에 도장을 열 번 넘게 찍음' },
    'p12.clerk': { name: '결재 대상 아님', desc: '담당 주무관에게 날인함' },
    'p12.none': { name: '미날인', desc: '도장을 찍지 않고 제출함' },
    'p12.upside': { name: '물구나무', desc: '도장을 거꾸로 찍음' },
    'p12.out': { name: '확인란 외 확인', desc: '확인란 밖에 찍음' },
    'p12.partial': { name: '반확인', desc: '확인란에 반쯤 걸쳐 찍음' },
    'p12.tilt': { name: '기울어진 확인', desc: '도장을 비스듬히 찍음' },
    'p12.double': { name: '확인 확인', desc: '확인란에 도장을 두 번 넘게 찍음' },
  },
};
