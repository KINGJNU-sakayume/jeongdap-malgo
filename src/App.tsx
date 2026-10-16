// 서식 화면. 대기석은 D9 — 그 전까지는 위쪽 탭으로 서식을 고른다(임시).
import { useState } from 'react';
import { isDebug } from './ui/DebugPanel';
import { PuzzleView } from './ui/PuzzleView';
import { P02_SCREEN } from './ui/screens/P02Screen';
import { P04_SCREEN } from './ui/screens/P04Screen';
import { P06_SCREEN } from './ui/screens/P06Screen';
import { P07_SCREEN } from './ui/screens/P07Screen';
import type { PuzzleScreen } from './ui/screens/types';
import { useGame } from './ui/useGame';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SCREENS: readonly PuzzleScreen<any>[] = [P02_SCREEN, P04_SCREEN, P06_SCREEN, P07_SCREEN];

export default function App() {
  const game = useGame();
  const [debug] = useState(() => isDebug());
  const [current, setCurrent] = useState(0);
  // 같은 서식을 다시 눌러도 재진입(새 진입 기록, 이번 진입 상태 초기화)
  const [visit, setVisit] = useState(0);
  const screen = SCREENS[current]!;

  const open = (i: number) => {
    setCurrent(i);
    setVisit((v) => v + 1);
  };

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 px-4 py-6">
      <nav className="flex gap-1 text-sm">
        {SCREENS.map((s, i) => (
          <button
            key={s.def.id}
            type="button"
            onClick={() => open(i)}
            className={`rounded-sm border px-3 py-1.5 ${i === current ? 'border-ink bg-ink text-white' : 'border-rule bg-white'}`}
          >
            {s.def.title}
          </button>
        ))}
      </nav>
      <PuzzleView key={`${screen.def.id}:${visit}`} screen={screen} game={game} debug={debug} />
    </main>
  );
}
