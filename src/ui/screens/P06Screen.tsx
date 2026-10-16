// P06 서명 화면. 정본: docs/puzzles/p06-signature.md '화면'.
import { P06, P06_A, P06_C, P06_STEP, p06Derived, type P06State } from '../../puzzles/p06';
import { StrokeWidget } from '../../widgets/StrokeWidget';
import { FORM_H, FormPaper, PaperTitle, rectStyle } from '../FormPaper';
import { Instruction } from '../Instruction';
import type { PuzzleScreen, ScreenProps } from './types';

function SignBox({ rect, label }: { rect: typeof P06_A; label: string }) {
  return (
    <div style={rectStyle(rect)} className="pointer-events-none border border-ink/70">
      <span className="absolute top-0.5 left-1 text-[11px] text-ink/60">{label}</span>
    </div>
  );
}

function P06Screen({ state, setState, onSubmit }: ScreenProps<P06State>) {
  return (
    <div className="flex flex-col gap-3">
      <FormPaper className="select-none">
        <PaperTitle y={0.06}>이상 없음 확인서 발급 신청서</PaperTitle>
        <div className="pointer-events-none absolute inset-x-[6%]" style={{ top: `${(0.55 / FORM_H) * 100}%` }}>
          <Instruction text={P06.instruction} verb={P06.verb} />
        </div>
        <SignBox rect={P06_A} label="신청인" />
        <SignBox rect={P06_C} label="담당자(도한결)" />
        <StrokeWidget strokes={state.strokes} step={P06_STEP} h={FORM_H} onStroke={(st) => setState((s) => ({ ...s, strokes: [...s.strokes, st] }))} />
      </FormPaper>
      <div className="flex justify-between">
        <button type="button" onClick={() => setState((s) => ({ strokes: [], erases: s.erases + 1 }))} className="rounded-sm border border-ink/50 px-5 py-2 font-serif text-[15px] text-ink/80 active:bg-ink/10">
          지우기
        </button>
        <button type="button" onClick={() => onSubmit(state)} className="rounded-sm border border-ink px-6 py-2 font-serif text-[15px] active:bg-ink/10">
          제출
        </button>
      </div>
    </div>
  );
}

export const P06_SCREEN: PuzzleScreen<P06State> = {
  def: P06,
  Screen: P06Screen,
  afterSubmit: (s) => ({ strokes: [], erases: s.erases }), // 서명(자유 입력)은 판정 후 버린다
  debugView: (s) => {
    const d = p06Derived(s);
    const r = (n: number) => Math.round(n * 1000) / 1000;
    return { strokes: s.strokes.length, points: s.strokes.reduce((n, st) => n + st.length, 0), erases: s.erases, L: r(d.L), fracA: r(d.fracA), fracC: r(d.fracC), coverage: r(d.coverage), straight: d.straight };
  },
};
