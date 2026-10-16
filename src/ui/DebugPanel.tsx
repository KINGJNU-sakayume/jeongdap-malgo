// 디버그 패널. ?debug 쿼리가 있을 때만 App이 붙인다.
// 단계 강제, 기록 초기화, 기록 JSON 복사, 결과 강제 발생, 현재 퍼즐 상태 보기.
import { useState } from 'react';
import type { PuzzleDef } from '../engine/types';
import { found, lastRepeatIndex } from '../log/derive';
import { currentStage } from '../log/stage';
import type { Game } from './useGame';

export function isDebug(search: string = globalThis.location?.search ?? ''): boolean {
  return new URLSearchParams(search).has('debug');
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const btn = 'rounded-sm border border-ink/40 px-2 py-1 text-xs active:bg-ink/10';
const on = 'bg-ink text-white';

export function DebugPanel<S>({ game, puzzle, state }: { game: Game; puzzle: PuzzleDef<S>; state: unknown }) {
  const [open, setOpen] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');
  const [fallback, setFallback] = useState<string | null>(null);

  const f = found(game.log);
  const wrongs = [...f].filter((id) => {
    const c = game.stageOptions.classOf(id);
    return c === 'wrong' || c === 'event';
  });
  const auto = currentStage(game.log, game.stageOptions);

  const copy = async () => {
    const json = JSON.stringify(game.log, null, 2);
    if (await copyText(json)) {
      setCopyMsg(`복사됨 (${game.log.length}개 항목)`);
      setFallback(null);
    } else {
      setCopyMsg('복사 실패. 아래에서 직접 복사');
      setFallback(json);
    }
  };

  const clear = () => {
    if (globalThis.confirm('기록을 전부 지울까요?')) game.clearLog();
  };

  return (
    // 화면 흐름 안(대사 줄 아래)에 둔다. 덮어씌우면 폰에서 대사 줄을 가린다.
    <div className="rounded-sm border border-dashed border-ink/40 bg-paper text-xs">
      <button type="button" className="w-full px-3 py-2 text-left font-mono" onClick={() => setOpen(!open)}>
        debug {open ? '▾' : '▸'} · 단계 {game.forcedStage ?? auto}
        {game.forcedStage !== null && ' (강제)'} · D={wrongs.length}
      </button>
      {open && (
        <div className="space-y-3 border-t border-ink/20 px-3 py-2">
          <section>
            <h2 className="mb-1 font-semibold">단계 강제</h2>
            <div className="flex flex-wrap gap-1">
              <button type="button" className={`${btn} ${game.forcedStage === null ? on : ''}`} onClick={() => game.setForcedStage(null)}>
                자동({auto})
              </button>
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" className={`${btn} ${game.forcedStage === n ? on : ''}`} onClick={() => game.setForcedStage(n)}>
                  S{n}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-1 font-semibold">결과 강제 발생 ({puzzle.prefix})</h2>
            <div className="flex flex-wrap gap-1">
              {[...puzzle.rules.map((r) => r.outcome), ...(puzzle.events ?? []).map((e) => e.outcome)].map((id) => (
                <button key={id} type="button" className={`${btn} ${f.has(id) ? 'border-seal text-seal' : ''}`} onClick={() => game.force(puzzle, id)}>
                  {id.slice(puzzle.prefix.length + 1)}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-1 font-semibold">기록</h2>
            <div className="flex flex-wrap gap-1">
              <button type="button" className={btn} onClick={copy}>
                JSON 복사
              </button>
              <button type="button" className={`${btn} border-seal text-seal`} onClick={clear}>
                기록 초기화
              </button>
            </div>
            {copyMsg && <p className="mt-1">{copyMsg}</p>}
            {fallback && <textarea readOnly className="mt-1 h-32 w-full font-mono" value={fallback} onFocus={(e) => e.target.select()} />}
          </section>

          <section>
            <h2 className="mb-1 font-semibold">현재 퍼즐 상태</h2>
            <pre className="overflow-x-auto bg-white p-2 font-mono whitespace-pre-wrap">
              {JSON.stringify(
                {
                  puzzle: puzzle.id,
                  state,
                  last: game.lastJudgement,
                  repeat: game.log.length ? lastRepeatIndex(game.log) : 0,
                  logLength: game.log.length,
                  persistent: game.persistent,
                  foundWrong: wrongs,
                },
                null,
                1,
              )}
            </pre>
          </section>
        </div>
      )}
    </div>
  );
}
