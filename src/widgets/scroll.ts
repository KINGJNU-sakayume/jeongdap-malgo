/** 스크롤 위치 → 0~1. 맨 위 0, 맨 아래 1. 스크롤할 게 없으면 1(이미 다 보임). */
export function scrollRatio(scrollTop: number, scrollHeight: number, clientHeight: number): number {
  const range = scrollHeight - clientHeight;
  if (range <= 0) return 1;
  return Math.min(1, Math.max(0, scrollTop / range));
}
