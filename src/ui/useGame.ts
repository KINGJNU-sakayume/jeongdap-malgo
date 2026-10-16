// 게임 진행 훅. 기록 저장소, 판정, 대사 선택을 묶는다.
// 시간(Date.now)은 여기서만 읽고 기록·상태에 넣어 준다. 판정 함수는 순수하게 둔다.
import { useCallback, useMemo, useRef, useState } from 'react';
import { COOL_STREAK, STAGE_CAP_PROTOTYPE, STAGE_THRESHOLDS } from '../config';
import { loadLineBook } from '../content';
import { judge } from '../engine/judge';
import type { Judgement, PuzzleDef } from '../engine/types';
import { lastRepeatIndex } from '../log/derive';
import type { StageOptions } from '../log/stage';
import { createLogStore } from '../log/storage';
import type { Log, OutcomeId } from '../log/types';
import { respond } from '../lines/respond';
import type { Beat } from '../lines/types';
import { allOutcomeClasses } from '../puzzles';

export interface Speech {
  /** 대사가 바뀔 때마다 증가. BeatPlayer의 key. */
  serial: number;
  beats: Beat[];
}

export interface Game {
  log: Log;
  persistent: boolean;
  stageOptions: StageOptions;
  speech: Speech | null;
  lastJudgement: Judgement | null;
  forcedStage: number | null;
  setForcedStage(n: number | null): void;
  /** 퍼즐 진입. 진입 기록 + 진입 대사. */
  enter<S>(def: PuzzleDef<S>): void;
  /** 제출. 판정 → 기록 → 대사. nameIfCorrect는 정답일 때만 {name}으로 세션 메모리에 둔다. */
  submit<S>(def: PuzzleDef<S>, state: S, nameIfCorrect?: string): Judgement;
  /** 디버그: 판정 없이 결과를 낸다. */
  force<S>(def: PuzzleDef<S>, outcome: OutcomeId): void;
  /** 디버그: 기록 전체 삭제. */
  clearLog(): void;
}

export function useGame(): Game {
  const store = useMemo(() => createLogStore(), []);
  const book = useMemo(() => loadLineBook(), []);
  const stageOptions = useMemo<StageOptions>(() => {
    const classes = allOutcomeClasses();
    return { classOf: (id) => classes.get(id), thresholds: STAGE_THRESHOLDS, cap: STAGE_CAP_PROTOTYPE, coolStreak: COOL_STREAK };
  }, []);

  const [log, setLog] = useState<Log>(() => store.read());
  const [speech, setSpeech] = useState<Speech | null>(null);
  const [lastJudgement, setLastJudgement] = useState<Judgement | null>(null);
  const [forcedStage, setForcedStage] = useState<number | null>(null);
  // {name}은 세션 메모리에만(CLAUDE.md 규칙 4). 새로고침하면 사라진다.
  const name = useRef<string | null>(null);
  const enteredAt = useRef(0);
  const serial = useRef(0);

  const say = useCallback(
    (next: Log, lineId: string, repeat: number) => {
      const r = respond({ log: next, book, lineId, repeat, stageOptions, forcedStage, name: name.current });
      serial.current += 1;
      setSpeech({ serial: serial.current, beats: r.beats });
    },
    [book, stageOptions, forcedStage],
  );

  const enter = useCallback(
    <S,>(def: PuzzleDef<S>) => {
      enteredAt.current = Date.now();
      const next = store.append({ t: 'enter', at: enteredAt.current, puzzle: def.id });
      setLog(next);
      say(next, `${def.prefix}.@enter`, 1);
    },
    [store, say],
  );

  const record = useCallback(
    (def: PuzzleDef<unknown>, j: Judgement) => {
      const now = Date.now();
      const next = store.append({ t: 'submit', at: now, puzzle: def.id, outcome: j.outcome, also: j.also, ms: now - enteredAt.current });
      setLog(next);
      setLastJudgement(j);
      say(next, j.outcome, lastRepeatIndex(next));
    },
    [store, say],
  );

  const submit = useCallback(
    <S,>(def: PuzzleDef<S>, state: S, nameIfCorrect?: string) => {
      const j = judge(def, state);
      if (j.kind === 'correct' && nameIfCorrect?.trim()) name.current = nameIfCorrect.trim();
      record(def as PuzzleDef<unknown>, j);
      return j;
    },
    [record],
  );

  const force = useCallback(
    <S,>(def: PuzzleDef<S>, outcome: OutcomeId) => {
      const rule = def.rules.find((r) => r.outcome === outcome);
      record(def as PuzzleDef<unknown>, { outcome, kind: rule?.kind ?? 'wrong', also: [] });
    },
    [record],
  );

  const clearLog = useCallback(() => {
    setLog(store.clear());
    setLastJudgement(null);
    name.current = null;
  }, [store]);

  return {
    log,
    persistent: store.persistent,
    stageOptions,
    speech,
    lastJudgement,
    forcedStage,
    setForcedStage,
    enter,
    submit,
    force,
    clearLog,
  };
}
