import { describe, expect, it } from 'vitest';
import { scrollRatio } from './scroll';

describe('scrollRatio', () => {
  it('맨 위 0, 맨 아래 1, 중간은 비율', () => {
    expect(scrollRatio(0, 1000, 250)).toBe(0);
    expect(scrollRatio(750, 1000, 250)).toBe(1);
    expect(scrollRatio(375, 1000, 250)).toBe(0.5);
  });
  it('범위를 넘으면 자르고, 스크롤할 게 없으면 1', () => {
    expect(scrollRatio(-10, 1000, 250)).toBe(0);
    expect(scrollRatio(800, 1000, 250)).toBe(1);
    expect(scrollRatio(0, 200, 250)).toBe(1);
  });
});
