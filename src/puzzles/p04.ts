// P04 체크박스. 정본: docs/puzzles/p04-checkbox.md
import type { PuzzleDef } from '../engine/types';

export interface P04State {
  yes: boolean;
  no: boolean;
  /** 여백에 남은 ✓ 개수 */
  marginMarks: number;
  /** 질문 칸 입력. 판정 후 폐기 */
  question: string;
  /** 예/아니오 체크 상태가 바뀐 총 횟수(이번 진입) */
  toggles: number;
}

const INITIAL: P04State = { yes: false, no: false, marginMarks: 0, question: '', toggles: 0 };
/** 예시에서 생략된 필드는 기본값(문서 표 아래 주석). */
const s = (p: Partial<P04State> = {}): P04State => ({ ...INITIAL, ...p });

export const P04: PuzzleDef<P04State> = {
  id: 'p04-checkbox',
  prefix: 'p04',
  chapter: 2,
  title: '체크박스',
  instruction: '해당하는 곳에 하나만 ✓ 하시오',
  verb: '하나만',
  initial: INITIAL,
  rules: [
    {
      outcome: 'p04.asker',
      kind: 'wrong',
      type: '문',
      when: (x) => x.question.trim() !== '',
      examples: [s({ question: '점심 드셨어요?', yes: true }), s({ question: '질문', yes: true, no: true })],
      notExamples: [s({ question: '   ', yes: true })],
    },
    {
      outcome: 'p04.both',
      kind: 'wrong',
      type: '과',
      when: (x) => x.yes && x.no,
      examples: [s({ yes: true, no: true })],
    },
    {
      outcome: 'p04.margin',
      kind: 'wrong',
      type: '탈',
      when: (x) => !x.yes && !x.no && x.marginMarks > 0,
      examples: [s({ marginMarks: 1 })],
    },
    {
      outcome: 'p04.none',
      kind: 'wrong',
      type: '방',
      when: (x) => !x.yes && !x.no,
      examples: [s()],
    },
    {
      outcome: 'p04.ok-yes',
      kind: 'correct',
      when: (x) => x.yes && !x.no,
      examples: [s({ yes: true }), s({ yes: true, marginMarks: 2 })],
    },
    {
      outcome: 'p04.ok-no',
      kind: 'correct',
      when: (x) => x.no && !x.yes,
      examples: [s({ no: true })],
    },
    // 논리상 도달 불가. 규칙 완전성을 위해 둔다(문서 충돌 메모).
    { outcome: 'p04.other', kind: 'other', when: () => true, examples: [] },
  ],
  events: [
    {
      outcome: 'p04.e-dither',
      when: (x) => x.toggles >= 10,
      examples: [s({ toggles: 10 })],
      notExamples: [s({ toggles: 9 })],
    },
  ],
  achievements: {
    'p04.asker': { name: '출제자', desc: '빈 질문란에 질문을 직접 적어 넣음' },
    'p04.both': { name: '예이자 아니오', desc: '예와 아니오에 모두 표시함' },
    'p04.margin': { name: '여백 체크', desc: '체크란이 아닌 여백에 표시함' },
    'p04.none': { name: '기권', desc: '아무 칸에도 표시하지 않음' },
    'p04.e-dither': { name: '딸깍', desc: '체크란을 열 번 넘게 고쳐 표시함' },
  },
};
