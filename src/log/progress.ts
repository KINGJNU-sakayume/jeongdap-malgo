// 대기석 서식 카드에 보일 값. 전부 기록에서 계산(D-002).
import type { PuzzleDef } from '../engine/types';
import { found } from './derive';
import type { Log } from './types';

/** 반려 도장 대상: 틀림 + 이벤트(화자 단계의 D와 같은 기준). */
export function rejectIds<S>(def: PuzzleDef<S>): string[] {
  return [...def.rules.filter((r) => r.kind === 'wrong').map((r) => r.outcome), ...(def.events ?? []).map((e) => e.outcome)];
}

/** 금색 「전수 확인」 대상: 업적이 있는 결과 전부(틀림 + 이벤트 + 정답 변주). */
export function sealIds<S>(def: PuzzleDef<S>): string[] {
  return [...rejectIds(def), ...def.rules.filter((r) => r.kind === 'variant').map((r) => r.outcome)];
}

/** 이 서식에서 찾은 반려 수(누적). */
export function rejectsFound<S>(log: Log, def: PuzzleDef<S>): number {
  const f = found(log);
  return rejectIds(def).filter((id) => f.has(id)).length;
}

/** 이 서식의 반려·변주를 전부 찾았는가. */
export function isSealed<S>(log: Log, def: PuzzleDef<S>): boolean {
  const f = found(log);
  return sealIds(def).every((id) => f.has(id));
}

/** 이 서식을 정답(변주 포함, 주 결과 기준)으로 처리한 적이 있는가. */
export function answeredCorrectly<S>(log: Log, def: PuzzleDef<S>): boolean {
  const ok = new Set(def.rules.filter((r) => r.kind === 'correct' || r.kind === 'variant').map((r) => r.outcome));
  return log.some((e) => e.t === 'submit' && ok.has(e.outcome));
}
