// 기하 판정 도우미. 좌표는 서식 좌표(가로 폭 1). docs/puzzles/_conventions.md

export interface Pt {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y);

export const inside = (p: Pt, r: Rect): boolean => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

/** 점과 사각형 사이 거리(안이면 0). */
export function distToRect(p: Pt, r: Rect): number {
  const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.w));
  const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.h));
  return Math.hypot(dx, dy);
}

/** 꺾은선 경로 길이. */
export function pathLength(pts: readonly Pt[]): number {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1]!, pts[i]!);
  return s;
}

/**
 * 획에 새 입력점을 덧붙이며 step 간격으로 재표본화한다(P06: 0.005).
 * 마지막 표본점에서 p 쪽으로 step마다 점을 찍는다. step보다 가까우면 아무것도 안 붙인다.
 * 획의 첫 점은 호출하는 쪽이 그대로 넣는다. 끝점은 finishStroke로 붙인다.
 */
export function appendResampled(stroke: readonly Pt[], p: Pt, step: number): Pt[] {
  const out = [...stroke];
  let last = out[out.length - 1];
  if (!last) return [p];
  let d = dist(last, p);
  while (d >= step) {
    const t = step / d;
    last = { x: last.x + (p.x - last.x) * t, y: last.y + (p.y - last.y) * t };
    out.push(last);
    d = dist(last, p);
  }
  return out;
}

/** 획을 끝낼 때 마지막 입력점을 남은 거리와 상관없이 붙인다(끝점 보존). */
export function finishStroke(stroke: readonly Pt[], p: Pt, step: number): Pt[] {
  const out = appendResampled(stroke, p, step);
  const last = out[out.length - 1]!;
  return dist(last, p) > 1e-9 ? [...out, p] : out;
}

/** 꼭짓점 목록을 step 간격 점열로. 테스트 픽스처 생성용. */
export function resamplePolyline(vertices: readonly Pt[], step: number): Pt[] {
  if (vertices.length === 0) return [];
  let out: Pt[] = [vertices[0]!];
  for (let i = 1; i < vertices.length; i++) {
    out = i === vertices.length - 1 ? finishStroke(out, vertices[i]!, step) : appendResampled(out, vertices[i]!, step);
    // 꼭짓점을 정확히 지나도록
    if (i < vertices.length - 1 && dist(out[out.length - 1]!, vertices[i]!) > 1e-9) out.push(vertices[i]!);
  }
  return out;
}

/** 원 넓이 중 사각형 안에 든 비율. n×n 격자 표본 근사. */
export function circleOverlapRatio(c: Pt, r: number, rect: Rect, n = 48): number {
  let inCircle = 0;
  let both = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const p = { x: c.x - r + ((i + 0.5) * 2 * r) / n, y: c.y - r + ((j + 0.5) * 2 * r) / n };
      if (dist(p, c) > r) continue;
      inCircle++;
      if (inside(p, rect)) both++;
    }
  }
  return inCircle === 0 ? 0 : both / inCircle;
}

/** 각도를 0~360으로 정규화(시계 방향, 0 = 바로 섬). */
export const normAngle = (deg: number): number => ((deg % 360) + 360) % 360;
