// P07 약관. 정본: docs/puzzles/p07-terms.md
import type { PuzzleDef } from '../engine/types';

export interface P07State {
  req1: boolean;
  req2: boolean;
  mkt: boolean;
  offwork: boolean;
  /** 이번 진입에서 '전체 동의'를 켠 적이 있는가 */
  allPressed: boolean;
  button: 'next' | 'refuse';
  /** 0~1, 본문 스크롤 최대 도달 비율 */
  scrollMax: number;
  /** 체크 상태 변경 횟수(전체 동의 한 번 = 1) */
  toggles: number;
}

const INITIAL: P07State = {
  req1: false,
  req2: false,
  mkt: false,
  offwork: false,
  allPressed: false,
  button: 'next',
  scrollMax: 0,
  toggles: 0,
};
const s = (p: Partial<P07State> = {}): P07State => ({ ...INITIAL, ...p });
const ALL = { req1: true, req2: true, mkt: true, offwork: true };

export const P07: PuzzleDef<P07State> = {
  id: 'p07-terms',
  prefix: 'p07',
  chapter: 3,
  title: '약관',
  instruction: '약관에 동의하시오',
  verb: '동의하시오',
  initial: INITIAL,
  rules: [
    {
      outcome: 'p07.refuse',
      kind: 'wrong',
      type: '문',
      when: (x) => x.button === 'refuse',
      examples: [s({ button: 'refuse' }), s({ ...ALL, allPressed: true, button: 'refuse' })],
    },
    {
      outcome: 'p07.pick',
      kind: 'wrong',
      type: '탈',
      when: (x) => x.allPressed && x.req1 && x.req2 && x.mkt && !x.offwork,
      examples: [s({ ...ALL, offwork: false, allPressed: true })],
      // 전체 동의 없이 하나씩 켠 경우, 마케팅도 끈 경우는 정답(충돌 메모)
      notExamples: [s({ req1: true, req2: true, mkt: true }), s({ req1: true, req2: true, allPressed: true })],
    },
    {
      outcome: 'p07.prayer',
      kind: 'wrong',
      type: '탈',
      when: (x) => x.offwork && !x.req1 && !x.req2,
      examples: [s({ offwork: true }), s({ offwork: true, mkt: true })],
    },
    {
      outcome: 'p07.missing',
      kind: 'wrong',
      type: '실',
      when: (x) => !(x.req1 && x.req2),
      examples: [s({ req1: true }), s()],
    },
    {
      outcome: 'p07.v-all',
      kind: 'variant',
      when: (x) => x.req1 && x.req2 && x.mkt && x.offwork,
      examples: [s({ ...ALL, allPressed: true }), s(ALL)],
    },
    {
      outcome: 'p07.ok',
      kind: 'correct',
      when: (x) => x.req1 && x.req2,
      examples: [s({ req1: true, req2: true }), s({ req1: true, req2: true, mkt: true })],
    },
    // 논리상 도달 불가.
    { outcome: 'p07.other', kind: 'other', when: () => true, examples: [] },
  ],
  events: [
    {
      outcome: 'p07.e-read',
      when: (x) => x.scrollMax >= 0.98,
      examples: [s({ scrollMax: 0.98 }), s({ scrollMax: 1 })],
      notExamples: [s({ scrollMax: 0.97 })],
    },
    {
      outcome: 'p07.e-toggle',
      when: (x) => x.toggles >= 20,
      examples: [s({ toggles: 20 })],
      notExamples: [s({ toggles: 19 })],
    },
  ],
  achievements: {
    'p07.refuse': { name: '부동의에 동의', desc: "'동의하지 않음'을 선택함" },
    'p07.pick': { name: '핀셋 해제', desc: '전체 동의 후 담당자 퇴근 기원만 해제함' },
    'p07.prayer': { name: '마음만 받겠습니다', desc: '필수 항목 없이 퇴근 기원에만 동의함' },
    'p07.missing': { name: '필수는 선택', desc: '필수 항목 동의를 빠뜨림' },
    'p07.v-all': { name: '퇴근 기원자', desc: '담당 주무관의 정시 퇴근을 빌어 줌' },
    'p07.e-read': { name: '제99조', desc: '약관을 끝까지 읽음' },
    'p07.e-toggle': { name: '딸깍 장인', desc: '동의란을 스무 번 넘게 고쳐 표시함' },
  },
};
