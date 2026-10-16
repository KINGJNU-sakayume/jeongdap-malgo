// 둥근 도장 인영(글자 「확인」). SVG 좌표계 안에서 중심 (cx, cy), 반지름 r, 시계 방향 rot도.
export function StampMarkSvg({ cx, cy, r, rot, opacity = 0.85 }: { cx: number; cy: number; r: number; rot: number; opacity?: number }) {
  return (
    <g transform={`rotate(${rot} ${cx} ${cy})`} opacity={opacity}>
      <circle cx={cx} cy={cy} r={r * 0.92} fill="none" className="stroke-seal" strokeWidth={r * 0.1} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={r * 0.62} fontWeight={700} className="fill-seal" style={{ fontFamily: 'serif' }}>
        확인
      </text>
    </g>
  );
}

/** 단독 도장(쟁반·끌기 미리보기). size는 px 지름. */
export function StampFace({ size, rot }: { size: number; rot: number }) {
  return (
    <svg width={size} height={size} viewBox="-1 -1 2 2" aria-hidden>
      <StampMarkSvg cx={0} cy={0} r={1} rot={rot} opacity={1} />
    </svg>
  );
}
