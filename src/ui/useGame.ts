// 게임 진행 훅. 기록 저장소, 판정, 대사 선택을 묶는다.
// 시간(Date.now)은 여기서만 읽고 기록·상태에 넣어 준다. 판정 함수는 순수하게 둔다.
import { useCallback, useMemo, useRef, useState } from 'react';
import { COOL_STREAK, STAGE_CAP_PROTOTYPE, STAGE_THRESHOLDS } from '../config';
import { loadLineBook } from '../content';
import { checkEvents, judge } from '../engine/judge';
import type { Judgement, PuzzleDef } from '../engine/types';
import { lastRepeatIndex } from '../log/derive';
import type { StageOptions } from '../log/stage';
import { createLogStore } from '../log/storage';
import type { Log, OutcomeId } from '../log/types';
import { respond } from '../lines/respond';
import type { Beat } from '../lines/types';
import { allOutcomeClasses } from '../puzzles';
import { ACHIEVEMENTS, OUTCOME_INDEX } from '../achievementList';
import { computeAchievements, type AchievementDef } from '../log/achievements';

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
  /** 상태가 바뀔 때마다. 이번 진입에서 아직 안 터진 이벤트를 터뜨린다(제출 없이). */
  observe<S>(def: PuzzleDef<S>, state: S): void;
  /** 디버그: 판정 없이 결과를 낸다. */
  force<S>(def: PuzzleDef<S>, outcome: OutcomeId): void;
  /** 방금 열린 업적(알림용). */
  unlocked: AchievementDef[];
  dismissUnlocked(id: string): void;
  /** 퍼즐 밖(대기석) 대사. 공용 대사 ID들을 이어서 말한다. */
  speak(lineIds: readonly string[]): void;
  /** 대사 줄 비우기. */
  hush(): void;
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
  /** 이번 진입에서 터진 이벤트. 진입 때 비운다. */
  const fired = useRef(new Set<OutcomeId>());
  const [unlocked, setUnlocked] = useState<AchievementDef[]>([]);
  const logRef = useRef<Log>(log);

  /** 덧붙인 기록을 반영하고, 새로 열린 업적을 알림에 넣는다. */
  const commit = useCallback((next: Log) => {
    const before = computeAchievements(logRef.current, ACHIEVEMENTS, OUTCOME_INDEX);
    const after = computeAchievements(next, ACHIEVEMENTS, OUTCOME_INDEX);
    const fresh = ACHIEVEMENTS.filter((a) => after.has(a.id) && !before.has(a.id));
    logRef.current = next;
    setLog(next);
    if (fresh.length > 0) setUnlocked((u) => [...u, ...fresh]);
  }, []);

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
      fired.current = new Set();
      const next = store.append({ t: 'enter', at: enteredAt.current, puzzle: def.id });
      commit(next);
      say(next, `${def.prefix}.@enter`, 1);
    },
    [store, say, commit],
  );

  const record = useCallback(
    (def: PuzzleDef<unknown>, j: Judgement) => {
      const now = Date.now();
      const next = store.append({ t: 'submit', at: now, puzzle: def.id, outcome: j.outcome, also: j.also, ms: now - enteredAt.current });
      commit(next);
      setLastJudgement(j);
      say(next, j.outcome, lastRepeatIndex(next));
    },
    [store, say, commit],
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

  const fire = useCallback(
    (def: PuzzleDef<unknown>, outcome: OutcomeId) => {
      fired.current.add(outcome);
      const next = store.append({ t: 'event', at: Date.now(), puzzle: def.id, outcome });
      commit(next);
      say(next, outcome, lastRepeatIndex(next));
    },
    [store, say, commit],
  );

  const observe = useCallback(
    <S,>(def: PuzzleDef<S>, state: S) => {
      for (const id of checkEvents(def, state, fired.current)) fire(def as PuzzleDef<unknown>, id);
    },
    [fire],
  );

  const force = useCallback(
    <S,>(def: PuzzleDef<S>, outcome: OutcomeId) => {
      if (def.events?.some((e) => e.outcome === outcome)) return fire(def as PuzzleDef<unknown>, outcome);
      const rule = def.rules.find((r) => r.outcome === outcome);
      record(def as PuzzleDef<unknown>, { outcome, kind: rule?.kind ?? 'wrong', also: [] });
    },
    [record, fire],
  );

  const speak = useCallback(
    (lineIds: readonly string[]) => {
      const beats = lineIds.flatMap(
        (lineId) => respond({ log: logRef.current, book, lineId, repeat: 1, stageOptions, forcedStage, name: name.current }).beats,
      );
      serial.current += 1;
      setSpeech({ serial: serial.current, beats });
    },
    [book, stageOptions, forcedStage],
  );
  const hush = useCallback(() => setSpeech(null), []);
  const dismissUnlocked = useCallback((id: string) => setUnlocked((u) => u.filter((a) => a.id !== id)), []);

  const clearLog = useCallback(() => {
    logRef.current = store.clear();
    setLog(logRef.current);
    setUnlocked([]);
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
    observe,
    force,
    unlocked,
    dismissUnlocked,
    speak,
    hush,
    clearLog,
  };
}
