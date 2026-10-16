// 화자 단계. docs/spec/data-format.md 5-4, docs/narrator-bible.md 3장.
//
//   D    = 누적으로 찾은 서로 다른 틀림·이벤트 수 (같은 틀림 반복은 안 올림)
//   raw  = D가 넘은 임계값 개수
//   cap  = 상한(프로토타입 5, 정식은 가장 먼 장)
//   cool = 현재 회차의 최근 제출 N개가 모두 정답(변주 포함)이면 1
//   stage = max(0, min(raw, cap) - cool)

import type { OutcomeClass } from '../engine/types';
import { outcomesOf } from './derive';
import type { Log } from './types';

export interface StageOptions {
  classOf: (outcome: string) => OutcomeClass | undefined;
  thresholds: readonly number[];
  cap: number;
  coolStreak: number;
}

export function rawStage(distinctWrong: number, thresholds: readonly number[]): number {
  return thresholds.filter((t) => distinctWrong >= t).length;
}

/** 각 항목 직후의 단계. 길이 = log.length. 한 번 훑어서 계산한다. */
export function stageTimeline(log: Log, o: StageOptions): number[] {
  const wrongs = new Set<string>();
  let recent: boolean[] = [];
  const out: number[] = [];
  for (const e of log) {
    if (e.t === 'reset') recent = [];
    for (const id of outcomesOf(e)) {
      const c = o.classOf(id);
      if (c === 'wrong' || c === 'event') wrongs.add(id);
    }
    if (e.t === 'submit') {
      const c = o.classOf(e.outcome);
      recent = [...recent, c === 'correct' || c === 'variant'].slice(-o.coolStreak);
    }
    const cool = recent.length === o.coolStreak && recent.every(Boolean) ? 1 : 0;
    out.push(Math.max(0, Math.min(rawStage(wrongs.size, o.thresholds), o.cap) - cool));
  }
  return out;
}

export function currentStage(log: Log, o: StageOptions): number {
  const t = stageTimeline(log, o);
  return t.length === 0 ? 0 : t[t.length - 1]!;
}

/**
 * 마지막 항목에서 처음으로 도달한 단계가 있으면 그 단계(여러 칸 올랐으면 가장 높은 것), 아니면 null.
 * '처음'은 기록 전체에서 처음. 식었다가 다시 오르면 전환 대사를 반복하지 않는다.
 */
export function newStageReached(log: Log, o: StageOptions): number | null {
  const t = stageTimeline(log, o);
  if (t.length === 0) return null;
  const now = t[t.length - 1]!;
  const before = Math.max(0, ...t.slice(0, -1));
  return now > before ? now : null;
}
