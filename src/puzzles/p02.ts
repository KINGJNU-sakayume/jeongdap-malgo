// P02 성명. 정본: docs/puzzles/p02-name.md
import { hasHangulOrLatin, inList, norm, trimmedLength } from '../engine/helpers/text';
import type { PuzzleDef } from '../engine/types';

export interface P02State {
  /** 판정 후 폐기. 정답일 때만 {name}으로 세션 메모리에 둔다. */
  text: string;
}

const LONG_30 = '김수한무거북이와두루미삼천갑자동방삭치치카포사리사리센타워리워리세브리깡';
const s = (text: string): P02State => ({ text });

export const P02: PuzzleDef<P02State> = {
  id: 'p02-name',
  prefix: 'p02',
  chapter: 1,
  title: '성명',
  instruction: '성명을 적으시오 (예: 홍길동)',
  verb: '적으시오',
  initial: { text: '' },
  rules: [
    {
      outcome: 'p02.empty',
      kind: 'wrong',
      type: '방',
      when: (x) => x.text.trim() === '',
      examples: [s(''), s('   ')],
      notExamples: [s('김')],
    },
    {
      outcome: 'p02.hong',
      kind: 'wrong',
      type: '문',
      when: (x) => norm(x.text) === '홍길동',
      examples: [s('홍길동'), s(' 홍 길 동 ')],
      notExamples: [s('홍길순')],
    },
    {
      outcome: 'p02.literal',
      kind: 'wrong',
      type: '문',
      when: (x) => inList(x.text, ['이름', '성명', '성함', '본인이름']),
      examples: [s('이름'), s('성 명')],
      notExamples: [s('이름이')],
    },
    {
      outcome: 'p02.clerk',
      kind: 'wrong',
      type: '탈',
      when: (x) => norm(x.text) === '도한결',
      examples: [s('도한결')],
      notExamples: [s('도한별')],
    },
    {
      outcome: 'p02.long',
      kind: 'wrong',
      type: '과',
      when: (x) => trimmedLength(x.text) >= 30,
      examples: [s(LONG_30.slice(0, 30))],
      notExamples: [s(LONG_30.slice(0, 29))],
    },
    {
      outcome: 'p02.robot',
      kind: 'wrong',
      type: '탈',
      when: (x) => !hasHangulOrLatin(x.text),
      examples: [s('1234'), s('★★'), s('ㅋㅋ')],
      notExamples: [s('김1')],
    },
    {
      outcome: 'p02.ok',
      kind: 'correct',
      when: (x) => /^[가-힣a-zA-Z ]{2,10}$/.test(x.text.trim()),
      examples: [s('김민지'), s('Alex Kim')],
      notExamples: [s('김'), s('김1')],
    },
    {
      outcome: 'p02.other',
      kind: 'other',
      when: () => true,
      examples: [s('김1'), s('김')],
    },
  ],
  achievements: {
    'p02.empty': { name: '무명씨', desc: '성명란을 비워 둔 채 제출함' },
    'p02.hong': { name: '예시와 같음', desc: '서식 예시를 그대로 적음' },
    'p02.literal': { name: '문자 그대로', desc: "성명란에 '이름'이라고 적음" },
    'p02.clerk': { name: '대리인 아님', desc: '담당 주무관 이름으로 신청함' },
    'p02.long': { name: '삼천갑자', desc: '칸보다 긴 이름을 적음' },
    'p02.robot': { name: '사람 확인 필요', desc: '사람 이름이 아닌 것을 적음' },
  },
};
