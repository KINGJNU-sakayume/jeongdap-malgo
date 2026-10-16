// 기록 → 화자 대사. 방금 덧붙인 항목에 대한 비트 목록을 만든다.
// 단계가 처음 오른 순간이면 단계 전환 대사(@stage-up.N)를 먼저 끼운다(narrator-bible.md 3-1).
import { found } from '../log/derive';
import { currentStage, newStageReached, type StageOptions } from '../log/stage';
import type { Log } from '../log/types';
import { beatsFor, type LineBook } from './select';
import type { Beat } from './types';

export interface RespondInput {
  /** 방금 항목을 덧붙인 뒤의 기록. */
  log: Log;
  book: LineBook;
  /** 대사 묶음 ID. 결과 ID 또는 'pNN.@enter'. */
  lineId: string;
  /** 이 결과의 반복 횟수(1부터). 진입 대사는 1. */
  repeat: number;
  stageOptions: StageOptions;
  /** 디버그 단계 강제. null이면 기록에서 계산. 강제 중에는 전환 대사를 끼우지 않는다. */
  forcedStage: number | null;
  /** {name}. 세션 메모리에만 있다. */
  name: string | null;
}

export interface Response {
  beats: Beat[];
  stage: number;
  /** 이번에 처음 도달한 단계. 없으면 null. */
  stageUp: number | null;
}

export function respond(i: RespondInput): Response {
  const stage = i.forcedStage ?? currentStage(i.log, i.stageOptions);
  const stageUp = i.forcedStage === null ? newStageReached(i.log, i.stageOptions) : null;
  const f = found(i.log);
  const beats: Beat[] = [];
  if (stageUp !== null) beats.push(...beatsFor(i.book, `@stage-up.${stageUp}`, { stage, repeat: 1, found: f }, i.name));
  beats.push(...beatsFor(i.book, i.lineId, { stage, repeat: i.repeat, found: f }, i.name));
  return { beats, stage, stageUp };
}
