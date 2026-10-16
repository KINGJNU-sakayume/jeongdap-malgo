// 대기석. 서식 카드 5장(찾은 반려 수만큼 빨간 반려 도장, 전부 찾으면 금색 「전수 확인」),
// 수집판, 음소거. 남은 수는 보여 주지 않는다(D-002).
import type { PuzzleDef } from '../engine/types';
import { hash32 } from '../lines/select';
import { isSealed, rejectsFound } from '../log/progress';
import type { Log } from '../log/types';
import { SpeechBar } from './SpeechBar';
import type { Game } from './useGame';
import { useSettings } from './useSettings';

/** 반려 도장 하나. 위치·각도는 서식·순번으로 결정적(난수 없음). */
function RejectStamp({ seed, i }: { seed: string; i: number }) {
  const h = hash32(`${seed}:${i}`);
  const rot = (h % 50) - 25;
  const dx = ((h >>> 8) % 90) - 60;
  const dy = ((h >>> 16) % 50) - 30;
  return (
    <span
      className="absolute right-3 bottom-3 rounded-sm border-2 border-seal px-1.5 font-serif text-sm font-bold text-seal opacity-80"
      style={{ transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)` }}
    >
      반려
    </span>
  );
}

function GoldSeal() {
  return (
    <span className="absolute top-2 right-2 flex size-14 rotate-[-12deg] items-center justify-center rounded-full border-2 border-gold text-center font-serif text-[11px] leading-tight font-bold text-gold">
      전수
      <br />
      확인
    </span>
  );
}

function FormCard({ def, log, onOpen }: { def: PuzzleDef<unknown>; log: Log; onOpen(): void }) {
  const n = rejectsFound(log, def);
  const sealed = isSealed(log, def);
  return (
    <button type="button" onClick={onOpen} className="relative h-32 overflow-hidden rounded-sm border border-rule bg-white p-3 text-left shadow-sm active:bg-paper">
      <span className="block text-xs text-ink/50">서식</span>
      <span className="block font-serif text-lg font-semibold">{def.title}</span>
      {Array.from({ length: n }, (_, i) => (
        <RejectStamp key={i} seed={def.id} i={i} />
      ))}
      {sealed && <GoldSeal />}
    </button>
  );
}

export function Hub({ game, puzzles, onOpen, onBoard }: { game: Game; puzzles: readonly PuzzleDef<unknown>[]; onOpen(i: number): void; onBoard(): void }) {
  const [s, set] = useSettings();
  return (
    <>
      <header className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-semibold">제1정답처리과 대기석</h1>
        <button type="button" onClick={() => set({ muted: !s.muted })} className="rounded-sm border border-rule bg-white px-3 py-1.5 text-sm">
          {s.muted ? '소리 켜기' : '소리 끄기'}
        </button>
      </header>
      <div className="grid grid-cols-2 gap-3">
        {puzzles.map((p, i) => (
          <FormCard key={p.id} def={p} log={game.log} onOpen={() => onOpen(i)} />
        ))}
      </div>
      <button type="button" onClick={onBoard} className="rounded-sm border border-ink bg-white py-2.5 font-serif">
        반려 사유 수집판
      </button>
      <SpeechBar game={game} />
    </>
  );
}
