// P02 성명 화면. 정본: docs/puzzles/p02-name.md '화면'.
import type { FormEvent } from 'react';
import { P02, type P02State } from '../../puzzles/p02';
import { TextWidget } from '../../widgets/TextWidget';
import { FormItem, FormSheet } from '../FormSheet';
import { Instruction } from '../Instruction';
import type { PuzzleScreen, ScreenProps } from './types';

export const P02_MAX = 40;

/** 지시문의 '(예: 홍길동)'은 입력칸 오른쪽 아래 예시로 보이므로 지시문 줄에서는 뺀다. */
const INSTRUCTION = P02.instruction.replace(/\s*\(예:[^)]*\)\s*$/, '');

function P02Screen({ state, setState, onSubmit }: ScreenProps<P02State>) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(state);
  };
  return (
    <form onSubmit={submit} noValidate>
      <FormSheet title="이상 없음 확인서 발급 신청서">
        <FormItem no={1} label={P02.title} htmlFor="p02-text">
          <TextWidget id="p02-text" value={state.text} onChange={(text) => setState({ text })} max={P02_MAX} hint="(예: 홍길동)" />
        </FormItem>
        <Instruction text={INSTRUCTION} verb={P02.verb} />
        <div className="mt-6 flex justify-end">
          <button type="submit" className="rounded-sm border border-ink px-6 py-2 font-serif text-[15px] active:bg-ink/10">
            제출
          </button>
        </div>
      </FormSheet>
    </form>
  );
}

export const P02_SCREEN: PuzzleScreen<P02State> = {
  def: P02,
  Screen: P02Screen,
  afterSubmit: () => P02.initial, // 원시 입력은 판정 후 버린다
  nameOf: (s) => s.text,
};
