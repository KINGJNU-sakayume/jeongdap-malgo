// scroll 위젯. 고정 높이 본문 상자. 최대 스크롤 도달 비율(0~1)을 알린다.
// 상자 높이는 본문 전체 길이의 heightRatio 이하(화면 크기와 무관하게 끝까지 읽으려면 스크롤이 필요하도록).
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { scrollRatio } from './scroll';

export interface ScrollWidgetProps {
  /** 지금까지의 최대 도달 비율. 더 커질 때만 onReach를 부른다. */
  max: number;
  onReach(ratio: number): void;
  heightRatio: number;
  children: ReactNode;
}

export function ScrollWidget({ max, onReach, heightRatio, children }: ScrollWidgetProps) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const measure = () => setHeight(Math.floor(el.scrollHeight * heightRatio));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [heightRatio]);

  return (
    <div
      data-no-margin
      className="overflow-y-auto overscroll-contain border border-rule bg-paper px-3 py-2"
      style={{ height: height ?? undefined, maxHeight: height === null ? '10rem' : undefined }}
      onScroll={(e) => {
        const t = e.currentTarget;
        const r = scrollRatio(t.scrollTop, t.scrollHeight, t.clientHeight);
        if (r > max) onReach(r);
      }}
    >
      <div ref={inner}>{children}</div>
    </div>
  );
}
