// 비트 출력 상태 기계. docs/spec/data-format.md 6-3.
// - 판정 후 첫 비트까지 FIRST_BEAT_DELAY_MS
// - 비트는 아주 빠른 타이핑으로 나온다. 다 나오면 정지(short/long) 뒤 다음 비트
// - 탭 한 번: 현재 비트 즉시 완성. 완성된 상태에서 탭: 바로 다음 비트
// 시간은 밖(컴포넌트 타이머)에서 'tick'으로 들어온다. 이 파일은 순수 함수만.
import type { Beat } from '../lines/types';

export type Phase = 'wait' | 'typing' | 'pause' | 'done';

export interface Playback {
  beats: readonly Beat[];
  /** 현재 비트. wait일 때 -1. */
  index: number;
  /** 현재 비트에서 보이는 글자 수(코드 포인트). */
  shown: number;
  phase: Phase;
}

export interface Timing {
  firstDelayMs: number;
  typeMsPerChar: number;
  pauseMs: { short: number; long: number };
}

export const len = (b: Beat): number => [...b.text].length;

export function start(beats: readonly Beat[]): Playback {
  return { beats, index: -1, shown: 0, phase: beats.length === 0 ? 'done' : 'wait' };
}

/** 비트 하나를 다 보인 상태. 마지막 비트면 done. */
function complete(p: Playback, index: number): Playback {
  const b = p.beats[index]!;
  return { ...p, index, shown: len(b), phase: index === p.beats.length - 1 ? 'done' : 'pause' };
}

function begin(p: Playback, index: number): Playback {
  const next: Playback = { ...p, index, shown: 0, phase: 'typing' };
  return len(p.beats[index]!) === 0 ? complete(next, index) : next;
}

/** 타이머가 끝났을 때. */
export function tick(p: Playback): Playback {
  switch (p.phase) {
    case 'wait':
      return begin(p, 0);
    case 'typing': {
      const shown = p.shown + 1;
      return shown >= len(p.beats[p.index]!) ? complete(p, p.index) : { ...p, shown };
    }
    case 'pause':
      return begin(p, p.index + 1);
    case 'done':
      return p;
  }
}

/** 플레이어가 탭했을 때. */
export function tap(p: Playback): Playback {
  switch (p.phase) {
    case 'wait':
      return complete(p, 0);
    case 'typing':
      return complete(p, p.index);
    case 'pause':
      return complete(p, p.index + 1);
    case 'done':
      return p;
  }
}

/** 다음 tick까지 기다릴 시간. done이면 null. */
export function delayOf(p: Playback, t: Timing): number | null {
  switch (p.phase) {
    case 'wait':
      return t.firstDelayMs;
    case 'typing':
      return t.typeMsPerChar;
    case 'pause':
      return t.pauseMs[p.beats[p.index]!.pause];
    case 'done':
      return null;
  }
}

/** 화면에 보일 줄들: 끝난 비트 전부 + 현재 비트의 보이는 부분. */
export function visibleLines(p: Playback): string[] {
  if (p.index < 0) return [];
  const done = p.beats.slice(0, p.index).map((b) => b.text);
  const cur = [...p.beats[p.index]!.text].slice(0, p.shown).join('');
  return [...done, cur];
}
