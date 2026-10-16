// 새 업적 알림. 화면 위에 잠깐 떴다가 사라진다. 탭하면 바로 닫힌다.
import { useEffect } from 'react';
import type { AchievementDef } from '../log/achievements';

const SHOW_MS = 3500;

function Toast({ a, onDone }: { a: AchievementDef; onDone(): void }) {
  useEffect(() => {
    const id = setTimeout(onDone, SHOW_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <button type="button" onClick={onDone} className="pointer-events-auto w-full rounded-sm border border-seal/60 bg-white px-3 py-2 text-left shadow-md">
      <span className="block font-serif text-[15px] font-semibold text-seal">「{a.name}」</span>
      <span className="block text-xs text-ink/70">{a.desc}</span>
    </button>
  );
}

export function Toasts({ items, dismiss }: { items: readonly AchievementDef[]; dismiss(id: string): void }) {
  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-40 mx-auto flex max-w-md flex-col gap-1 px-4" aria-live="polite">
      {items.slice(0, 3).map((a) => (
        <Toast key={a.id} a={a} onDone={() => dismiss(a.id)} />
      ))}
    </div>
  );
}
