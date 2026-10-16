// 비율이 고정된 서식 종이. 안쪽 요소는 서식 좌표(가로 폭 1, 세로 H)로 놓는다.
// 화면 크기와 무관하게 같은 서식 좌표가 같은 자리에 온다(docs/puzzles/_conventions.md).
import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import type { Pt, Rect } from '../engine/helpers/geometry';

export const FORM_H = 1.414;

/** 서식 좌표 사각형 → 종이 안 절대 위치 스타일. */
export function rectStyle(r: Rect, h = FORM_H): CSSProperties {
  return { position: 'absolute', left: `${r.x * 100}%`, top: `${(r.y / h) * 100}%`, width: `${r.w * 100}%`, height: `${(r.h / h) * 100}%` };
}

/** 서식 좌표 점 → 종이 안 절대 위치 스타일(점이 왼쪽 위). */
export function pointStyle(p: Pt, h = FORM_H): CSSProperties {
  return { position: 'absolute', left: `${p.x * 100}%`, top: `${(p.y / h) * 100}%` };
}

/** 화면 좌표 → 서식 좌표. el은 종이 요소. */
export function toForm(el: Element, clientX: number, clientY: number): Pt {
  const r = el.getBoundingClientRect();
  return { x: (clientX - r.left) / r.width, y: (clientY - r.top) / r.width };
}

export const FormPaper = forwardRef<HTMLDivElement, { h?: number; children: ReactNode; className?: string; style?: CSSProperties }>(
  function FormPaper({ h = FORM_H, children, className = '', style }, ref) {
    return (
      <div
        ref={ref}
        className={`relative w-full overflow-hidden rounded-sm border border-rule bg-white shadow-sm ${className}`}
        style={{ aspectRatio: `1 / ${h}`, ...style }}
      >
        {children}
      </div>
    );
  },
);

/** 종이 위 제목(서식 좌표 y 위치에 가운데 정렬). */
export function PaperTitle({ y, children }: { y: number; children: ReactNode }) {
  return (
    <div className="absolute inset-x-[6%] border-b-2 border-ink pb-2 text-center font-serif text-lg font-semibold tracking-wide" style={{ top: `${(y / FORM_H) * 100}%` }}>
      {children}
    </div>
  );
}
