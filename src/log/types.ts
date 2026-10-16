// 기록(로그) 타입. docs/spec/data-format.md 4장.
// 기록이 유일한 원천이다. 단계·반복·업적은 모두 여기서 계산한다.

export type PuzzleId = string; // 'p02-name'
export type OutcomeId = string; // 'p02.hong'
export type EndingId = 'A' | 'B' | 'C' | 'D';

export type LogEntry =
  | { t: 'enter'; at: number; puzzle: PuzzleId }
  | { t: 'submit'; at: number; puzzle: PuzzleId; outcome: OutcomeId; also: OutcomeId[]; ms: number }
  | { t: 'event'; at: number; puzzle: PuzzleId; outcome: OutcomeId }
  | { t: 'ending'; at: number; ending: EndingId }
  | { t: 'reset'; at: number };

export type Log = readonly LogEntry[];

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** 저장소에서 읽은 값이 올바른 항목인지 검사한다. 모르는 필드는 무시. */
export function isLogEntry(v: unknown): v is LogEntry {
  if (!v || typeof v !== 'object') return false;
  const e = v as Record<string, unknown>;
  if (!isNum(e.at)) return false;
  switch (e.t) {
    case 'enter':
      return isStr(e.puzzle);
    case 'submit':
      return (
        isStr(e.puzzle) &&
        isStr(e.outcome) &&
        Array.isArray(e.also) &&
        e.also.every(isStr) &&
        isNum(e.ms)
      );
    case 'event':
      return isStr(e.puzzle) && isStr(e.outcome);
    case 'ending':
      return e.ending === 'A' || e.ending === 'B' || e.ending === 'C' || e.ending === 'D';
    case 'reset':
      return true;
    default:
      return false;
  }
}
