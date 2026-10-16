// 화면 전환: 대기석 ↔ 서식 ↔ 수집판. 진행도·업적은 전부 기록에서 계산한다.
import { useEffect, useRef, useState } from 'react';
import type { PuzzleDef } from './engine/types';
import { answeredCorrectly, isSealed } from './log/progress';
import type { Log } from './log/types';
import { Board } from './ui/Board';
import { isDebug } from './ui/DebugPanel';
import { Hub } from './ui/Hub';
import { PuzzleView } from './ui/PuzzleView';
import { P02_SCREEN } from './ui/screens/P02Screen';
import { P04_SCREEN } from './ui/screens/P04Screen';
import { P06_SCREEN } from './ui/screens/P06Screen';
import { P07_SCREEN } from './ui/screens/P07Screen';
import { P12_SCREEN } from './ui/screens/P12Screen';
import type { PuzzleScreen } from './ui/screens/types';
import { Toasts } from './ui/Toasts';
import { useGame } from './ui/useGame';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SCREENS: readonly PuzzleScreen<any>[] = [P02_SCREEN, P04_SCREEN, P06_SCREEN, P07_SCREEN, P12_SCREEN];
const DEFS: readonly PuzzleDef<unknown>[] = SCREENS.map((s) => s.def);

type View = { kind: 'hub' } | { kind: 'puzzle'; i: number; visit: number } | { kind: 'board' };

/** 대기석 대사 판단용 요약. */
function hubSnapshot(log: Log) {
  return { sealed: new Set(DEFS.filter((d) => isSealed(log, d)).map((d) => d.id)), allOk: DEFS.every((d) => answeredCorrectly(log, d)) };
}

export default function App() {
  const game = useGame();
  const [debug] = useState(() => isDebug());
  const [view, setView] = useState<View>({ kind: 'hub' });
  const visits = useRef(0);
  // 대기석에 마지막으로 있었을 때의 상태. 처음 값은 불러온 기록(새로고침 뒤 다시 말하지 않도록).
  const lastHub = useRef(hubSnapshot(game.log));
  const greeted = useRef(false);
  // 직전 화면 종류. 대기석으로 '들어올 때' 한 번만 처리한다(StrictMode의 effect 두 번 실행 대비).
  const prevKind = useRef<View['kind'] | null>(null);

  const { speak, hush, log } = game;
  useEffect(() => {
    const entering = view.kind === 'hub' && prevKind.current !== 'hub';
    prevKind.current = view.kind;
    if (!entering) return;
    const now = hubSnapshot(log);
    const lines: string[] = [];
    if (!greeted.current) lines.push('@hub.enter'); // 대기석에 처음 들어올 때(이번 세션)
    if (now.allOk && !lastHub.current.allOk) lines.push('@hub.all-ok');
    if ([...now.sealed].some((id) => !lastHub.current.sealed.has(id))) lines.push('@hub.seal');
    greeted.current = true;
    lastHub.current = now;
    if (lines.length > 0) speak(lines);
    else hush();
    // 대기석으로 바뀔 때만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.kind]);

  const open = (i: number) => setView({ kind: 'puzzle', i, visit: ++visits.current });

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 px-4 py-6">
      <Toasts items={game.unlocked} dismiss={game.dismissUnlocked} />
      {view.kind === 'hub' && <Hub game={game} puzzles={DEFS} onOpen={open} onBoard={() => setView({ kind: 'board' })} />}
      {view.kind === 'board' && <Board log={game.log} onBack={() => setView({ kind: 'hub' })} />}
      {view.kind === 'puzzle' && (
        <PuzzleView key={`${view.i}:${view.visit}`} screen={SCREENS[view.i]!} game={game} debug={debug} onBack={() => setView({ kind: 'hub' })} />
      )}
    </main>
  );
}
