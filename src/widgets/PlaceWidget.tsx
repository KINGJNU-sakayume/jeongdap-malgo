// place 위젯. 쟁반의 도장을 끌어다 놓으면 한 번 찍힌다. ↺ ↻ 로 45도씩 돌린다.
// 놓은 자리: 서식 종이 위면 서식 좌표로 onPlace, 화자 아이콘 위면 onTarget('clerk-icon'), 그 밖은 무시.
import { useRef, useState, type PointerEvent, type RefObject } from 'react';
import { normAngle, type Pt } from '../engine/helpers/geometry';
import { toForm } from '../ui/FormPaper';
import { StampFace } from '../ui/Stamp';

export interface PlaceWidgetProps {
  paper: RefObject<HTMLDivElement | null>;
  /** 찍힌 모양 반지름(서식 좌표) */
  r: number;
  rot: number;
  onRotate(rot: number): void;
  onPlace(p: Pt, rot: number): void;
  onTarget(target: string): void;
}

export function PlaceWidget({ paper, r, rot, onRotate, onPlace, onTarget }: PlaceWidgetProps) {
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const pid = useRef<number | null>(null);
  const size = Math.round((paper.current?.getBoundingClientRect().width ?? 320) * r * 2);

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (pid.current !== null) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pid.current = e.pointerId;
    setDrag({ x: e.clientX, y: e.clientY });
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (pid.current !== e.pointerId) return;
    setDrag({ x: e.clientX, y: e.clientY });
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    if (pid.current !== e.pointerId) return;
    pid.current = null;
    setDrag(null);
    if (e.type === 'pointercancel') return;
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const target = hit?.closest('[data-target]')?.getAttribute('data-target');
    if (target) return onTarget(target);
    const el = paper.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) return;
    onPlace(toForm(el, e.clientX, e.clientY), rot);
  };

  return (
    <div className="flex items-center justify-center gap-4 rounded-sm border border-rule bg-white/60 py-3">
      <button type="button" aria-label="왼쪽으로 돌리기" onClick={() => onRotate(normAngle(rot - 45))} className="size-11 rounded-full border border-ink/40 text-xl active:bg-ink/10">
        ↺
      </button>
      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="cursor-grab rounded-full p-1"
        style={{ touchAction: 'none', opacity: drag ? 0.3 : 1 }}
      >
        <StampFace size={size} rot={rot} />
      </div>
      <button type="button" aria-label="오른쪽으로 돌리기" onClick={() => onRotate(normAngle(rot + 45))} className="size-11 rounded-full border border-ink/40 text-xl active:bg-ink/10">
        ↻
      </button>
      {drag && (
        <div className="pointer-events-none fixed z-50" style={{ left: drag.x - size / 2, top: drag.y - size / 2 }}>
          <StampFace size={size} rot={rot} />
        </div>
      )}
    </div>
  );
}
