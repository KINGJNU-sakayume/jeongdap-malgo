// 퍼즐 정의 타입. docs/spec/data-format.md 3장.
import type { OutcomeId, PuzzleId } from '../log/types';

export type OutcomeKind = 'correct' | 'variant' | 'wrong' | 'other';
/** 틀림 유형(작성 점검용). docs/puzzle-authoring.md 3장. */
export type WrongType = '실' | '문' | '과' | '탈' | '방' | '복합';

export interface Rule<S> {
  outcome: OutcomeId;
  kind: OutcomeKind;
  type?: WrongType;
  /** 순수 함수. Date.now, Math.random, DOM 접근 금지. */
  when: (s: S) => boolean;
  /** 이 결과가 나와야 하는 상태. 자동 검사가 테스트로 쓴다. */
  examples: S[];
  /** 이 결과가 나오면 안 되는 상태. */
  notExamples?: S[];
}

/** 제출 없이 상태 변화마다 평가. 퍼즐 한 번 진입에 한 번만 터진다. */
export interface EventRule<S> {
  outcome: OutcomeId;
  when: (s: S) => boolean;
  examples: S[];
  notExamples?: S[];
}

export interface AchievementText {
  name: string;
  desc: string;
}

export interface PuzzleDef<S> {
  id: PuzzleId; // 'p02-name'
  /** 결과 ID 접두어. 'p02' */
  prefix: string;
  chapter: 1 | 2 | 3 | 4 | 5;
  title: string;
  instruction: string;
  /** 큰 글씨 동사. '적으시오' */
  verb: string;
  initial: S;
  /** 위에서부터 평가. 첫 일치가 주 결과. 마지막은 kind: 'other'. */
  rules: Rule<S>[];
  events?: EventRule<S>[];
  /** 틀림·이벤트·정답 변주마다 업적 이름과 설명(docs/puzzles 결과 표 그대로). */
  achievements: Record<OutcomeId, AchievementText>;
}

/** 결과 ID → 종류. 이벤트는 'event'. */
export type OutcomeClass = OutcomeKind | 'event';

export interface Judgement {
  outcome: OutcomeId;
  kind: OutcomeKind;
  /** 주 결과 외에 함께 일치한 결과(other 제외). */
  also: OutcomeId[];
}
