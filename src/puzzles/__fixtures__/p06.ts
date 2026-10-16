// P06 예시용 획 생성 함수. docs/puzzles/p06-signature.md 충돌 메모.
import { resamplePolyline, type Pt, type Rect } from '../../engine/helpers/geometry';

export const STEP = 0.005;

/** rect 안쪽(여백 margin 비율)을 왼쪽에서 오른쪽으로 n번 꺾이는 지그재그. */
export function zigzag(r: Rect, n = 8, margin = 0.1): Pt[] {
  const x0 = r.x + r.w * margin;
  const x1 = r.x + r.w * (1 - margin);
  const yTop = r.y + r.h * 0.2;
  const yBot = r.y + r.h * 0.8;
  const v: Pt[] = [];
  for (let i = 0; i <= n; i++) v.push({ x: x0 + ((x1 - x0) * i) / n, y: i % 2 === 0 ? yBot : yTop });
  return resamplePolyline(v, STEP);
}

/** rect 세로 가운데를 가로지르는 직선. */
export function straight(r: Rect, margin = 0.1): Pt[] {
  const y = r.y + r.h / 2;
  return resamplePolyline([{ x: r.x + r.w * margin, y }, { x: r.x + r.w * (1 - margin), y }], STEP);
}

/** rect 중앙의 아주 짧은 획(점 하나처럼). */
export function dot(r: Rect, len = 0.01): Pt[] {
  const c = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  return resamplePolyline([c, { x: c.x + len, y: c.y }], STEP);
}

/** rect를 가로로 촘촘히 왕복하며 채우는 획. */
export function fill(r: Rect, gap = 0.015): Pt[] {
  const v: Pt[] = [];
  let left = true;
  for (let y = r.y + 0.004; y <= r.y + r.h - 0.004; y += gap) {
    v.push({ x: left ? r.x + 0.004 : r.x + r.w - 0.004, y });
    v.push({ x: left ? r.x + r.w - 0.004 : r.x + 0.004, y });
    left = !left;
  }
  return resamplePolyline(v, STEP);
}

/** rect 중앙의 반원 호(직선 아님). 길이 ≈ π·radius. */
export function arc(r: Rect, radius: number): Pt[] {
  const c = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  const v: Pt[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = Math.PI + (Math.PI * i) / 60;
    v.push({ x: c.x + radius * Math.cos(t), y: c.y + radius * Math.sin(t) });
  }
  return resamplePolyline(v, STEP);
}
