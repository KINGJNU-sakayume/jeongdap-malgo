// 구현된 퍼즐 목록. 퍼즐을 추가하면 여기에 넣는다. 자동 검사가 이 목록을 돈다.
import type { OutcomeClass, PuzzleDef } from '../engine/types';
import { outcomeClasses } from '../engine/judge';
import { P02 } from './p02';
import { P04 } from './p04';
import { P06 } from './p06';
import { P07 } from './p07';

// 퍼즐마다 상태 타입이 달라서 목록에서는 unknown으로 묶는다.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PUZZLES: readonly PuzzleDef<any>[] = [P02, P04, P06, P07];

export function puzzleByPrefix(prefix: string): PuzzleDef<unknown> | undefined {
  return PUZZLES.find((p) => p.prefix === prefix);
}

/** 구현된 모든 퍼즐의 결과 ID → 종류. 단계·업적 계산에 쓴다. */
export function allOutcomeClasses(): Map<string, OutcomeClass> {
  const m = new Map<string, OutcomeClass>();
  for (const p of PUZZLES) for (const [k, v] of outcomeClasses(p)) m.set(k, v);
  return m;
}
