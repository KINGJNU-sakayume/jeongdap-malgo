// 퍼즐 한 번 진입. 마운트 = 진입(재진입은 부모가 key를 바꿔 새로 마운트).
// 상태가 바뀔 때마다 이벤트를 검사한다(제출 없이 터진다).
import { useEffect, useRef, useState } from 'react';
import { BeatPlayer } from './BeatPlayer';
import { DebugPanel } from './DebugPanel';
import type { PuzzleScreen } from './screens/types';
import type { Game } from './useGame';

export function PuzzleView<S>({ screen, game, debug }: { screen: PuzzleScreen<S>; game: Game; debug: boolean }) {
  const { def, Screen } = screen;
  const [state, setState] = useState<S>(def.initial);

  // StrictMode에서 effect가 두 번 돌아도 진입은 한 번만 기록한다.
  const entered = useRef(false);
  useEffect(() => {
    if (entered.current) return;
    entered.current = true;
    game.enter(def);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    game.observe(def, state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const submit = (s: S) => {
    game.submit(def, s, screen.nameOf?.(s));
    setState(screen.afterSubmit(s));
  };

  return (
    <>
      <Screen state={state} setState={setState} onSubmit={submit} />
      {/* 서식이 화면보다 길어도(P07) 대사가 보이도록 화면 아래에 붙인다. */}
      {game.speech && (
        <div className="sticky bottom-2 z-10">
          <BeatPlayer key={game.speech.serial} beats={game.speech.beats} />
        </div>
      )}
      {debug && <DebugPanel game={game} puzzle={def} state={state} />}
    </>
  );
}
