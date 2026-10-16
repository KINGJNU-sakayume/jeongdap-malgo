// 기록에서 계산하는 값들. docs/spec/data-format.md 5장.
// 전부 (log) => 값 형태의 순수 함수. 아무것도 저장하지 않는다.

import type { Log, LogEntry, OutcomeId } from './types';

/** 마지막 reset 이후의 항목(현재 회차). reset이 없으면 전체. */
export function currentRun(log: Log): Log {
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i]!.t === 'reset') return log.slice(i + 1);
  }
  return log;
}

/** 항목 하나가 '찾게 해 준' 결과들. 제출의 주 결과 + also, 이벤트 결과. */
export function outcomesOf(e: LogEntry): OutcomeId[] {
  if (e.t === 'submit') return [e.outcome, ...e.also];
  if (e.t === 'event') return [e.outcome];
  return [];
}

/** 누적으로 한 번이라도 나온 결과 ID 집합(reset과 무관). */
export function found(log: Log): Set<OutcomeId> {
  const s = new Set<OutcomeId>();
  for (const e of log) for (const o of outcomesOf(e)) s.add(o);
  return s;
}

/** 이 항목의 '주 결과'. 대사·반복 계산의 기준. 제출은 outcome, 이벤트는 outcome, 그 밖은 없음. */
export function primaryOutcome(e: LogEntry): OutcomeId | null {
  return e.t === 'submit' || e.t === 'event' ? e.outcome : null;
}

/**
 * index 위치 항목의 주 결과가 그 시점까지 몇 번째로 나온 것인지(1부터).
 * 누적 기준(reset과 무관): 화자는 회차가 바뀌어도 기억한다.
 * also로만 나온 경우는 세지 않는다(대사가 나간 적이 없으므로).
 */
export function repeatIndexAt(log: Log, index: number): number {
  const target = log[index];
  if (!target) throw new RangeError(`기록 범위 밖: ${index}`);
  const id = primaryOutcome(target);
  if (id === null) return 0;
  let n = 0;
  for (let i = 0; i <= index; i++) if (primaryOutcome(log[i]!) === id) n++;
  return n;
}

/** 마지막 항목의 반복 횟수. 방금 덧붙인 제출의 대사를 고를 때 쓴다. */
export function lastRepeatIndex(log: Log): number {
  return log.length === 0 ? 0 : repeatIndexAt(log, log.length - 1);
}

/** 대사 변주의 repeat 조건(1, 2, 3=3회 이상)으로 바꾼다. */
export function repeatBucket(n: number): 1 | 2 | 3 {
  return n <= 1 ? 1 : n === 2 ? 2 : 3;
}
