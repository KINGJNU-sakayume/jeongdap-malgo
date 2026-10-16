// 화자 대사 줄. 서식 아래 고정. 탭하면 현재 비트 완성 → 다음 비트.
// 새 대사가 오면 부모가 key를 바꿔 끊고 새로 시작한다(끼어들기).
import { useEffect, useState } from 'react';
import { FIRST_BEAT_DELAY_MS, PAUSE_MS, TYPE_MS_PER_CHAR } from '../config';
import type { Beat } from '../lines/types';
import { delayOf, start, tap, tick, visibleLines, type Timing } from './beatPlayback';

const TIMING: Timing = { firstDelayMs: FIRST_BEAT_DELAY_MS, typeMsPerChar: TYPE_MS_PER_CHAR, pauseMs: PAUSE_MS };

export function BeatPlayer({ beats }: { beats: readonly Beat[] }) {
  const [p, setP] = useState(() => start(beats));

  useEffect(() => {
    const d = delayOf(p, TIMING);
    if (d === null) return;
    const id = setTimeout(() => setP(tick), d);
    return () => clearTimeout(id);
  }, [p]);

  const lines = visibleLines(p);
  return (
    <button
      type="button"
      onClick={() => setP(tap)}
      aria-live="polite"
      className="block min-h-28 w-full rounded-sm border border-rule bg-white px-4 py-3 text-left"
    >
      <span className="mb-1 block text-xs text-ink/60">도한결 주무관</span>
      {lines.map((text, i) => (
        <span key={i} className="block text-[15px] leading-relaxed">
          {text}
          {i === lines.length - 1 && p.phase === 'typing' && <span className="opacity-0">▍</span>}
        </span>
      ))}
      {p.phase === 'pause' && <span className="block text-xs text-ink/40">…</span>}
    </button>
  );
}
