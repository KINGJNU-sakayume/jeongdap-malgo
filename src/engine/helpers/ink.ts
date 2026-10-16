// 잉크(획) 판정 도우미. docs/puzzles/p06-signature.md '파생값'.
import { dist, distToRect, inside, pathLength, type Pt, type Rect } from './geometry';

export type Strokes = readonly (readonly Pt[])[];

/** 모든 획 경로 길이 합 ÷ 기준 폭. P06의 L. */
export function inkLength(strokes: Strokes, refWidth: number): number {
  return strokes.reduce((s, st) => s + pathLength(st), 0) / refWidth;
}

/** 전체 점 중 rect 안 비율. 점이 0개면 0. */
export function fractionIn(strokes: Strokes, rect: Rect): number {
  let n = 0;
  let k = 0;
  for (const st of strokes)
    for (const p of st) {
      n++;
      if (inside(p, rect)) k++;
    }
  return n === 0 ? 0 : k / n;
}

/** rect를 cols×rows 격자로 나눴을 때 잉크(반지름 radius)가 닿은 칸 비율. */
export function inkCoverage(strokes: Strokes, rect: Rect, cols: number, rows: number, radius: number): number {
  const cw = rect.w / cols;
  const ch = rect.h / rows;
  let hit = 0;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const cell = { x: rect.x + i * cw, y: rect.y + j * ch, w: cw, h: ch };
      if (strokes.some((st) => st.some((p) => distToRect(p, cell) <= radius))) hit++;
    }
  }
  return hit / (cols * rows);
}

/** 획이 정확히 1개, 끝점 거리 ÷ 경로 길이 ≥ ratio, 길이(기준 폭 대비) ≥ minLen. */
export function isStraightStroke(strokes: Strokes, refWidth: number, ratio: number, minLen: number): boolean {
  if (strokes.length !== 1) return false;
  const st = strokes[0]!;
  const len = pathLength(st);
  if (len === 0 || st.length < 2) return false;
  return dist(st[0]!, st[st.length - 1]!) / len >= ratio && len / refWidth >= minLen;
}
