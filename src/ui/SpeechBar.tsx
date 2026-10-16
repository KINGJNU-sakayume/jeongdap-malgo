// 화면 아래에 붙는 화자 아이콘 + 대사 줄. 서식이 화면보다 길어도 대사가 보이게.
import { BeatPlayer } from './BeatPlayer';
import { ClerkIcon } from './ClerkIcon';
import type { Game } from './useGame';

export function SpeechBar({ game, clerkMarks = 0 }: { game: Game; clerkMarks?: number }) {
  return (
    <div className="sticky bottom-2 z-10 flex items-end gap-2">
      <ClerkIcon marks={clerkMarks} />
      <div className="min-w-0 flex-1">{game.speech && <BeatPlayer key={game.speech.serial} beats={game.speech.beats} />}</div>
    </div>
  );
}
