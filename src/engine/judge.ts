// 판정기. docs/spec/data-format.md 3-2.
import type { OutcomeId } from '../log/types';
import type { Judgement, OutcomeClass, PuzzleDef } from './types';

/**
 * 제출 판정. 규칙을 전부 평가하고 첫 일치를 주 결과로, 나머지 일치(other 제외)를 also로 돌려준다.
 * 규칙 함수가 예외를 던지면 그 규칙은 불일치로 본다(판정이 멈추면 안 되므로). 개발 중에는 콘솔에 알린다.
 */
export function judge<S>(def: PuzzleDef<S>, state: S): Judgement {
  const matched: { outcome: OutcomeId; kind: Judgement['kind'] }[] = [];
  for (const r of def.rules) {
    let ok = false;
    try {
      ok = r.when(state);
    } catch (err) {
      if (import.meta.env?.DEV) console.error(`[judge] ${r.outcome} 규칙 오류`, err);
    }
    if (ok) matched.push({ outcome: r.outcome, kind: r.kind });
  }
  const first = matched[0];
  if (!first) {
    // 마지막 규칙이 other면 여기 올 수 없다. validatePuzzle이 막는다.
    throw new Error(`[judge] ${def.id}: 어떤 규칙에도 맞지 않음. 마지막 규칙이 other인지 확인`);
  }
  const also = matched
    .slice(1)
    .filter((m) => m.kind !== 'other')
    .map((m) => m.outcome);
  return { outcome: first.outcome, kind: first.kind, also };
}

/**
 * 이벤트 판정. 이번 진입에서 아직 안 터진 이벤트 중 조건을 만족하는 것들을 정의 순서대로 돌려준다.
 * 호출하는 쪽이 fired 집합을 관리한다(퍼즐 진입 때 비움).
 */
export function checkEvents<S>(def: PuzzleDef<S>, state: S, fired: ReadonlySet<OutcomeId>): OutcomeId[] {
  const out: OutcomeId[] = [];
  for (const ev of def.events ?? []) {
    if (fired.has(ev.outcome)) continue;
    let ok = false;
    try {
      ok = ev.when(state);
    } catch (err) {
      if (import.meta.env?.DEV) console.error(`[events] ${ev.outcome} 규칙 오류`, err);
    }
    if (ok) out.push(ev.outcome);
  }
  return out;
}

/** 퍼즐의 모든 결과 ID → 종류. */
export function outcomeClasses<S>(def: PuzzleDef<S>): Map<OutcomeId, OutcomeClass> {
  const m = new Map<OutcomeId, OutcomeClass>();
  for (const r of def.rules) m.set(r.outcome, r.kind);
  for (const e of def.events ?? []) m.set(e.outcome, 'event');
  return m;
}
