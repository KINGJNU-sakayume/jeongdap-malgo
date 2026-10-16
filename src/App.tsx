// D4: P02 화면 하나. 대기석은 D9.
import { useEffect, useRef, useState } from 'react';
import { P02, type P02State } from './puzzles/p02';
import { BeatPlayer } from './ui/BeatPlayer';
import { DebugPanel, isDebug } from './ui/DebugPanel';
import { P02Screen } from './ui/screens/P02Screen';
import { useGame } from './ui/useGame';

export default function App() {
  const game = useGame();
  const [p02, setP02] = useState<P02State>(P02.initial);
  const [debug] = useState(() => isDebug());

  // StrictMode에서 effect가 두 번 돌아도 진입은 한 번만 기록한다.
  const entered = useRef(false);
  const { enter } = game;
  useEffect(() => {
    if (entered.current) return;
    entered.current = true;
    enter(P02);
  }, [enter]);

  const submit = (s: P02State) => {
    game.submit(P02, s, s.text);
    setP02(P02.initial); // 원시 입력은 판정 후 버린다
  };

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 px-4 py-6">
      <P02Screen state={p02} setState={setP02} onSubmit={submit} />
      {game.speech && <BeatPlayer key={game.speech.serial} beats={game.speech.beats} />}
      {debug && <DebugPanel game={game} puzzle={P02} state={p02} />}
    </main>
  );
}
