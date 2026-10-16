// P04 체크박스 화면. 정본: docs/puzzles/p04-checkbox.md '화면'.
// - 「3.」 뒤 질문 자리는 밑줄만. 탭하면 작은 입력칸이 열린다(시각적 힌트 없음).
// - 체크란·버튼이 아닌 서식 여백을 탭하면 그 자리에 연필 ✓. 다시 탭하면 지워진다.
import { useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { P04, type P04State } from '../../puzzles/p04';
import { CheckWidget } from '../../widgets/CheckWidget';
import { FormSheet } from '../FormSheet';
import { Instruction } from '../Instruction';
import type { PuzzleScreen, ScreenProps } from './types';

const QUESTION_MAX = 30;

/** 서식 좌표(가로 폭 1 기준). docs/puzzles/_conventions.md */
interface Mark {
  x: number;
  y: number;
}

function P04Screen({ state, setState, onSubmit }: ScreenProps<P04State>) {
  const sheet = useRef<HTMLDivElement>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [asking, setAsking] = useState(false);

  const setMarksAndCount = (next: Mark[]) => {
    setMarks(next);
    setState((s) => ({ ...s, marginMarks: next.length }));
  };

  const onSheetClick = (e: MouseEvent) => {
    const target = e.target as Element;
    const markEl = target.closest('[data-mark]');
    if (markEl) {
      const i = Number(markEl.getAttribute('data-mark'));
      setMarksAndCount(marks.filter((_, j) => j !== i));
      return;
    }
    if (target.closest('[data-no-margin]') || !sheet.current) return;
    const r = sheet.current.getBoundingClientRect();
    setMarksAndCount([...marks, { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.width }]);
  };

  const toggle = (key: 'yes' | 'no') => setState((s) => ({ ...s, [key]: !s[key], toggles: s.toggles + 1 }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(state);
  };

  return (
    <form onSubmit={submit} noValidate>
      <div ref={sheet} onClick={onSheetClick} className="relative" style={{ containerType: 'inline-size' }}>
        <FormSheet title="이상 없음 확인서 발급 신청서">
          <div className="flex items-end gap-2 border-b border-rule pb-3 font-serif text-[15px]">
            <span>3.</span>
            {asking ? (
              <input
                data-no-margin
                autoFocus
                type="text"
                value={state.question}
                maxLength={QUESTION_MAX}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setState((s) => ({ ...s, question: e.target.value }))}
                className="min-w-0 flex-1 border-0 border-b border-ink/60 bg-transparent px-1 text-[15px] outline-none"
              />
            ) : (
              <span data-no-margin onClick={() => setAsking(true)} className="block h-6 flex-1 border-b border-ink/60" />
            )}
          </div>
          <div className="mt-4 flex gap-8 pl-6">
            <CheckWidget checked={state.yes} onToggle={() => toggle('yes')}>
              예
            </CheckWidget>
            <CheckWidget checked={state.no} onToggle={() => toggle('no')}>
              아니오
            </CheckWidget>
          </div>
          <Instruction text={P04.instruction} verb={P04.verb} />
          <div className="mt-6 flex justify-end">
            <button data-no-margin type="submit" className="rounded-sm border border-ink px-6 py-2 font-serif text-[15px] active:bg-ink/10">
              제출
            </button>
          </div>
        </FormSheet>
        {marks.map((m, i) => (
          <span
            key={i}
            data-mark={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 p-2 text-lg leading-none text-ink/60 select-none"
            style={{ left: `${m.x * 100}%`, top: `${m.y * 100}cqw` }}
          >
            ✓
          </span>
        ))}
      </div>
    </form>
  );
}

export const P04_SCREEN: PuzzleScreen<P04State> = {
  def: P04,
  Screen: P04Screen,
  afterSubmit: (s) => ({ ...s, question: '' }), // 질문 칸 입력은 판정 후 버린다
};
