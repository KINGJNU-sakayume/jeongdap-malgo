// 화면 구석 화자 아이콘(명찰 + 머그컵). 서식 밖 대상 'clerk-icon'.
// P12에서 도장을 여기 놓으면 이마에 작은 인영이 생긴다.
export const CLERK_ICON_TARGET = 'clerk-icon';

export function ClerkIcon({ marks = 0 }: { marks?: number }) {
  return (
    <div data-target={CLERK_ICON_TARGET} className="relative size-14 shrink-0 select-none" aria-label="도한결 주무관">
      <svg viewBox="0 0 56 56" className="size-full" aria-hidden>
        {/* 머리 */}
        <circle cx="26" cy="22" r="15" className="fill-white stroke-ink" strokeWidth="1.5" />
        <circle cx="21" cy="23" r="1.4" className="fill-ink" />
        <circle cx="31" cy="23" r="1.4" className="fill-ink" />
        <path d="M21 29 q5 2.5 10 0" fill="none" className="stroke-ink" strokeWidth="1.3" strokeLinecap="round" />
        {/* 몸·명찰 */}
        <path d="M8 56 q0 -16 18 -16 q18 0 18 16" className="fill-white stroke-ink" strokeWidth="1.5" />
        <rect x="16" y="45" width="12" height="6" rx="1" className="fill-paper stroke-ink" strokeWidth="1" />
        {/* 머그컵 */}
        <rect x="42" y="40" width="9" height="11" rx="1.5" className="fill-white stroke-ink" strokeWidth="1.3" />
        <path d="M51 43 q4 0 4 3 q0 3 -4 3" fill="none" className="stroke-ink" strokeWidth="1.3" />
        {/* 이마 인영 */}
        {Array.from({ length: Math.min(marks, 6) }, (_, i) => (
          <circle key={i} cx={20 + (i % 3) * 6} cy={12 + Math.floor(i / 3) * 4} r="2.6" fill="none" className="stroke-seal" strokeWidth="1.2" />
        ))}
      </svg>
    </div>
  );
}
