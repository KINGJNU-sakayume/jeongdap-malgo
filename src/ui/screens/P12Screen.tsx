// P12 도장 화면. 정본: docs/puzzles/p12-stamp.md '화면'.
import { useRef, useState } from 'react';
import { P12, P12_B, P12_R, overlapOf, placeOf, poseOf, type P12State } from '../../puzzles/p12';
import { PlaceWidget } from '../../widgets/PlaceWidget';
import { CLERK_ICON_TARGET } from '../ClerkIcon';
import { FORM_H, FormPaper, PaperTitle, rectStyle } from '../FormPaper';
import { Instruction } from '../Instruction';
import { StampMarkSvg } from '../Stamp';
import type { PuzzleScreen, ScreenProps } from './types';

function P12Screen({ state, setState, onSubmit }: ScreenProps<P12State>) {
  const paper = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <FormPaper ref={paper} className="select-none">
        <PaperTitle y={0.06}>이상 없음 확인서 발급 신청서</PaperTitle>
        <div className="absolute inset-x-[6%]" style={{ top: `${(0.6 / FORM_H) * 100}%` }}>
          <Instruction text={P12.instruction} verb={P12.verb} />
        </div>
        <div style={rectStyle(P12_B)} className="border border-ink/70">
          <span className="absolute top-0.5 left-1 text-[11px] text-ink/60">확인</span>
        </div>
        <svg viewBox={`0 0 1 ${FORM_H}`} className="pointer-events-none absolute inset-0 size-full">
          {state.marks.map((m, i) => (
            <StampMarkSvg key={i} cx={m.x} cy={m.y} r={P12_R} rot={m.rot} />
          ))}
        </svg>
      </FormPaper>
      <PlaceWidget
        paper={paper}
        r={P12_R}
        rot={rot}
        onRotate={setRot}
        onPlace={(p, r) => setState((s) => ({ ...s, marks: [...s.marks, { x: p.x, y: p.y, rot: r }] }))}
        onTarget={(t) => {
          if (t === CLERK_ICON_TARGET) setState((s) => ({ ...s, clerkMarks: s.clerkMarks + 1 }));
        }}
      />
      <div className="flex justify-end">
        <button type="button" onClick={() => onSubmit(state)} className="rounded-sm border border-ink px-6 py-2 font-serif text-[15px] active:bg-ink/10">
          제출
        </button>
      </div>
    </div>
  );
}

export const P12_SCREEN: PuzzleScreen<P12State> = {
  def: P12,
  Screen: P12Screen,
  afterSubmit: (s) => s, // 인영은 사라지지 않는다(재진입 시 초기화)
  clerkMarks: (s) => s.clerkMarks,
  debugView: (s) => ({
    clerkMarks: s.clerkMarks,
    marks: s.marks.map((m) => ({ x: +m.x.toFixed(3), y: +m.y.toFixed(3), rot: m.rot, overlap: +overlapOf(m).toFixed(2), place: placeOf(m), pose: poseOf(m) })),
  }),
};
