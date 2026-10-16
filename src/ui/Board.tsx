// 반려 사유 수집판(업적 목록). D-002, puzzle-authoring.md 7장.
// 찾은 것만 이름·설명을 보이고(찾은 순서), 못 찾은 것은 서식별로 묶지 않고 끝에 한꺼번에.
import { ACHIEVEMENTS, OUTCOME_INDEX } from '../achievementList';
import { computeAchievements } from '../log/achievements';
import type { Log } from '../log/types';

export const LOCKED_LINE = '??? 반려 사유 미확인';

export function Board({ log, onBack }: { log: Log; onBack(): void }) {
  const got = computeAchievements(log, ACHIEVEMENTS, OUTCOME_INDEX);
  const found = ACHIEVEMENTS.filter((a) => got.has(a.id)).sort((a, b) => got.get(a.id)! - got.get(b.id)!);
  const locked = ACHIEVEMENTS.length - found.length;
  return (
    <>
      <header className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-semibold">반려 사유 수집판</h1>
        <button type="button" onClick={onBack} className="rounded-sm border border-rule bg-white px-3 py-1.5 text-sm">
          돌아가기
        </button>
      </header>
      <ol className="divide-y divide-rule rounded-sm border border-rule bg-white">
        {found.map((a) => (
          <li key={a.id} className="px-4 py-2.5">
            <span className="block font-serif font-semibold">{a.name}</span>
            <span className="block text-sm text-ink/70">{a.desc}</span>
          </li>
        ))}
        {Array.from({ length: locked }, (_, i) => (
          <li key={`locked-${i}`} className="px-4 py-2.5 text-sm text-ink/40">
            {LOCKED_LINE}
          </li>
        ))}
      </ol>
    </>
  );
}
