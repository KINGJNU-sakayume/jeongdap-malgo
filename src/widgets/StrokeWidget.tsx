// stroke 위젯. 서식 전체가 그리기 영역. 포인터 좌표를 즉시 서식 좌표로 바꾸고 step 간격으로 재표본화한다.
// 그리기 영역은 touch-action: none(그리는 동안 페이지 스크롤 막기).
import { useRef, useState, type PointerEvent } from 'react';
import { appendResampled, finishStroke, type Pt } from '../engine/helpers/geometry';
import { toForm } from '../ui/FormPaper';

export interface StrokeWidgetProps {
  strokes: Pt[][];
  /** 획 하나가 끝났을 때 */
  onStroke(stroke: Pt[]): void;
  step: number;
  h: number;
}

const toPoints = (st: readonly Pt[]) => st.map((p) => `${p.x},${p.y}`).join(' ');

export function StrokeWidget({ strokes, onStroke, step, h }: StrokeWidgetProps) {
  const svg = useRef<SVGSVGElement>(null);
  const drawing = useRef<{ id: number; pts: Pt[] } | null>(null);
  const [live, setLive] = useState<Pt[] | null>(null);

  const at = (e: PointerEvent) => toForm(svg.current!, e.clientX, e.clientY);

  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (drawing.current) return; // 두 번째 손가락 무시
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = { id: e.pointerId, pts: [at(e)] };
    setLive(drawing.current.pts);
  };

  const move = (e: PointerEvent<SVGSVGElement>) => {
    const d = drawing.current;
    if (!d || d.id !== e.pointerId) return;
    const events = typeof e.nativeEvent.getCoalescedEvents === 'function' ? e.nativeEvent.getCoalescedEvents() : [];
    const raw = events.length > 0 ? events.map((c) => toForm(svg.current!, c.clientX, c.clientY)) : [at(e)];
    for (const p of raw) d.pts = appendResampled(d.pts, p, step);
    setLive(d.pts);
  };

  const up = (e: PointerEvent<SVGSVGElement>) => {
    const d = drawing.current;
    if (!d || d.id !== e.pointerId) return;
    drawing.current = null;
    setLive(null);
    onStroke(e.type === 'pointercancel' ? d.pts : finishStroke(d.pts, at(e), step));
  };

  return (
    <svg
      ref={svg}
      viewBox={`0 0 1 ${h}`}
      className="absolute inset-0 size-full"
      style={{ touchAction: 'none' }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {[...strokes, ...(live ? [live] : [])].map((st, i) =>
        st.length === 1 ? (
          <circle key={i} cx={st[0]!.x} cy={st[0]!.y} r={0.004} className="fill-ink" />
        ) : (
          <polyline key={i} points={toPoints(st)} fill="none" className="stroke-ink" strokeWidth={0.006} strokeLinecap="round" strokeLinejoin="round" />
        ),
      )}
    </svg>
  );
}
