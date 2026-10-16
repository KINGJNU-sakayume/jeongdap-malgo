// 업적. docs/spec/data-format.md 5-5. 저장하지 않고 기록에서 매번 계산한다.
import type { OutcomeClass, PuzzleDef } from '../engine/types';
import { outcomesOf } from './derive';
import type { EndingId, Log, LogEntry, OutcomeId, PuzzleId } from './types';

/** 문서는 kind 하나지만, '틀림+이벤트'를 함께 세기 위해 배열도 받는다. */
export type Selector = { puzzle?: PuzzleId; kind?: SelKind | SelKind[] };
type SelKind = 'wrong' | 'event' | 'variant';

export type Cond =
  | { found: OutcomeId }
  | { foundAll: OutcomeId[] | Selector }
  | { foundCount: Selector; n: number }
  | { repeat: OutcomeId; n: number }
  | { seq: [OutcomeId, OutcomeId]; samePuzzle?: true }
  | { ending: EndingId }
  | { fn: keyof typeof NAMED };

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  hidden: true;
  cond: Cond;
  /** 서식 업적이면 그 퍼즐. 메타 업적은 없음. */
  puzzle?: PuzzleId;
}

/** 결과 ID → 종류·퍼즐. 구현된 퍼즐 정의에서 만든다. */
export interface OutcomeIndex {
  classOf(id: OutcomeId): OutcomeClass | undefined;
  puzzleOf(id: OutcomeId): PuzzleId | undefined;
  /** 셀렉터에 맞는 모든 결과 ID(정의 기준). */
  select(sel: Selector): OutcomeId[];
}

export function makeOutcomeIndex(defs: readonly PuzzleDef<unknown>[]): OutcomeIndex {
  const cls = new Map<OutcomeId, OutcomeClass>();
  const pz = new Map<OutcomeId, PuzzleId>();
  for (const d of defs) {
    for (const r of d.rules) {
      cls.set(r.outcome, r.kind);
      pz.set(r.outcome, d.id);
    }
    for (const e of d.events ?? []) {
      cls.set(e.outcome, 'event');
      pz.set(e.outcome, d.id);
    }
  }
  const matches = (id: OutcomeId, sel: Selector) => {
    if (sel.puzzle && pz.get(id) !== sel.puzzle) return false;
    if (sel.kind) {
      const kinds = Array.isArray(sel.kind) ? sel.kind : [sel.kind];
      if (!kinds.includes(cls.get(id) as SelKind)) return false;
    }
    return true;
  };
  return {
    classOf: (id) => cls.get(id),
    puzzleOf: (id) => pz.get(id),
    select: (sel) => [...cls.keys()].filter((id) => matches(id, sel)),
  };
}

/** 이름 붙은 예외 조건. 기록 앞에서부터 i번째 항목까지 본 상태로 판단한다. */
interface ScanState {
  found: Set<OutcomeId>;
  primaryCount: Map<OutcomeId, number>;
  /** 직전 제출(주 결과) */
  prevSubmit: Extract<LogEntry, { t: 'submit' }> | null;
  lastSubmit: Extract<LogEntry, { t: 'submit' }> | null;
  endings: Set<EndingId>;
}

const isCorrect = (c: OutcomeClass | undefined) => c === 'correct' || c === 'variant';

const NAMED = {
  /** 「알고 그랬죠」: 같은 퍼즐 정답(변주 포함) 바로 다음 제출이 그 퍼즐의 틀림. */
  knewIt: (s: ScanState, ix: OutcomeIndex) =>
    !!s.prevSubmit &&
    !!s.lastSubmit &&
    s.prevSubmit.puzzle === s.lastSubmit.puzzle &&
    isCorrect(ix.classOf(s.prevSubmit.outcome)) &&
    ix.classOf(s.lastSubmit.outcome) === 'wrong',
} satisfies Record<string, (s: ScanState, ix: OutcomeIndex) => boolean>;

function holds(c: Cond, s: ScanState, ix: OutcomeIndex): boolean {
  if ('found' in c) return s.found.has(c.found);
  if ('foundAll' in c) {
    const ids = Array.isArray(c.foundAll) ? c.foundAll : ix.select(c.foundAll);
    return ids.length > 0 && ids.every((id) => s.found.has(id));
  }
  if ('foundCount' in c) return ix.select(c.foundCount).filter((id) => s.found.has(id)).length >= c.n;
  if ('repeat' in c) return (s.primaryCount.get(c.repeat) ?? 0) >= c.n;
  if ('seq' in c)
    return (
      !!s.prevSubmit &&
      !!s.lastSubmit &&
      s.prevSubmit.outcome === c.seq[0] &&
      s.lastSubmit.outcome === c.seq[1] &&
      (!c.samePuzzle || s.prevSubmit.puzzle === s.lastSubmit.puzzle)
    );
  if ('ending' in c) return s.endings.has(c.ending);
  return NAMED[c.fn](s, ix);
}

/** 기록을 한 번 훑어 각 업적이 처음 참이 된 시각. */
export function computeAchievements(log: Log, defs: readonly AchievementDef[], ix: OutcomeIndex): Map<string, number> {
  const out = new Map<string, number>();
  const s: ScanState = { found: new Set(), primaryCount: new Map(), prevSubmit: null, lastSubmit: null, endings: new Set() };
  for (const e of log) {
    for (const o of outcomesOf(e)) s.found.add(o);
    if (e.t === 'submit' || e.t === 'event') s.primaryCount.set(e.outcome, (s.primaryCount.get(e.outcome) ?? 0) + 1);
    if (e.t === 'submit') {
      s.prevSubmit = s.lastSubmit;
      s.lastSubmit = e;
    }
    if (e.t === 'ending') s.endings.add(e.ending);
    for (const a of defs) if (!out.has(a.id) && holds(a.cond, s, ix)) out.set(a.id, e.at);
  }
  return out;
}

/** 틀림·이벤트·정답 변주마다 `a.<결과ID>` 업적 자동 생성. 이름·설명은 퍼즐 정의(문서 결과 표). */
export function autoAchievements(defs: readonly PuzzleDef<unknown>[]): AchievementDef[] {
  const out: AchievementDef[] = [];
  for (const d of defs) {
    const ids = [...d.rules.filter((r) => r.kind === 'wrong' || r.kind === 'variant').map((r) => r.outcome), ...(d.events ?? []).map((e) => e.outcome)];
    for (const id of ids) {
      const t = d.achievements[id];
      if (t) out.push({ id: `a.${id}`, name: t.name, desc: t.desc, hidden: true, cond: { found: id }, puzzle: d.id });
    }
  }
  return out;
}

/** 프로토타입 메타 업적 2개(prototype-scope.md 3장). 수집가는 n=10으로 축소. */
export const META_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'a.meta.collector',
    name: '반려 사유 수집가',
    desc: '반려 사유 10건 이상 접수',
    hidden: true,
    cond: { foundCount: { kind: ['wrong', 'event'] }, n: 10 },
  },
  {
    id: 'a.meta.knew-it',
    name: '알고 그랬죠',
    desc: '정답 처리 직후 같은 서식을 고의로 반려시킴',
    hidden: true,
    cond: { fn: 'knewIt' },
  },
];

/** 업적 조건이 가리키는 결과 ID(존재 검사용). */
export function referencedOutcomes(c: Cond): OutcomeId[] {
  if ('found' in c) return [c.found];
  if ('foundAll' in c) return Array.isArray(c.foundAll) ? c.foundAll : [];
  if ('repeat' in c) return [c.repeat];
  if ('seq' in c) return [...c.seq];
  return [];
}
