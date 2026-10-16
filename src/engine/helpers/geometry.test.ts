import { describe, expect, it } from 'vitest';
import { appendResampled, circleOverlapRatio, dist, distToRect, finishStroke, normAngle, pathLength, resamplePolyline } from './geometry';
import { fractionIn, inkCoverage, inkLength, isStraightStroke } from './ink';

const R = { x: 0, y: 0, w: 1, h: 1 };

describe('geometry', () => {
  it('distToRect: 안이면 0, 밖이면 가장 가까운 변까지', () => {
    expect(distToRect({ x: 0.5, y: 0.5 }, R)).toBe(0);
    expect(distToRect({ x: 1.3, y: 0.5 }, R)).toBeCloseTo(0.3);
    expect(distToRect({ x: 1.3, y: 1.4 }, R)).toBeCloseTo(0.5);
  });

  it('재표본화: step 간격, 끝점 보존', () => {
    const s = finishStroke(appendResampled([{ x: 0, y: 0 }], { x: 0.0123, y: 0 }, 0.005), { x: 0.0123, y: 0 }, 0.005);
    expect(s.map((p) => +p.x.toFixed(4))).toEqual([0, 0.005, 0.01, 0.0123]);
    expect(appendResampled([{ x: 0, y: 0 }], { x: 0.003, y: 0 }, 0.005)).toHaveLength(1);
  });

  it('resamplePolyline은 꼭짓점을 지나고 길이를 보존한다', () => {
    const v = [{ x: 0, y: 0 }, { x: 0.1, y: 0 }, { x: 0.1, y: 0.1 }];
    const pts = resamplePolyline(v, 0.005);
    expect(pathLength(pts)).toBeCloseTo(0.2, 6);
    expect(pts.some((p) => dist(p, v[1]!) < 1e-9)).toBe(true);
    expect(pts.at(-1)).toEqual(v[2]);
  });

  it('원-사각형 겹침 비율', () => {
    expect(circleOverlapRatio({ x: 0.5, y: 0.5 }, 0.1, R)).toBe(1);
    expect(circleOverlapRatio({ x: 2, y: 2 }, 0.1, R)).toBe(0);
    expect(circleOverlapRatio({ x: 1, y: 0.5 }, 0.1, R)).toBeCloseTo(0.5, 1);
  });

  it('각도 정규화', () => {
    expect(normAngle(-45)).toBe(315);
    expect(normAngle(360)).toBe(0);
    expect(normAngle(405)).toBe(45);
  });
});

describe('ink', () => {
  const line = resamplePolyline([{ x: 0.1, y: 0.5 }, { x: 0.9, y: 0.5 }], 0.005);
  it('inkLength는 기준 폭으로 나눈 길이', () => {
    expect(inkLength([line], 0.8)).toBeCloseTo(1, 6);
    expect(inkLength([], 1)).toBe(0);
  });
  it('fractionIn', () => {
    expect(fractionIn([line], { x: 0, y: 0, w: 0.5, h: 1 })).toBeCloseTo(0.5, 1);
    expect(fractionIn([], R)).toBe(0);
  });
  it('inkCoverage: 가로선 하나는 한 줄만 칠한다', () => {
    expect(inkCoverage([line], { x: 0.1, y: 0.4, w: 0.8, h: 0.2 }, 4, 4, 0.001)).toBeCloseTo(0.25 * 2, 6); // 선이 가운데 경계에 걸쳐 두 줄
    expect(inkCoverage([line], { x: 0.1, y: 0.4, w: 0.8, h: 0.2 }, 4, 2, 0.001)).toBe(1);
  });
  it('isStraightStroke', () => {
    expect(isStraightStroke([line], 0.8, 0.95, 0.3)).toBe(true);
    expect(isStraightStroke([line, line], 0.8, 0.95, 0.3)).toBe(false);
    const bent = resamplePolyline([{ x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 0.5, y: 0.5 }], 0.005);
    expect(isStraightStroke([bent], 1, 0.95, 0.3)).toBe(false);
  });
});
