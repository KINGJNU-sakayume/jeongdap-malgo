// P02 성명 화면. 정본: docs/puzzles/p02-name.md '화면'.
import type { FormEvent } from 'react';
import { P02, type P02State } from '../../puzzles/p02';
import { TextWidget } from '../../widgets/TextWidget';
import { FormItem, FormSheet } from '../FormSheet';
import { Instruction } from '../Instruction';

export const P02_MAX = 40;

export function P02Screen({ state, setState, onSubmit }: { state: P02State; setState(s: P02State): void; onSubmit(s: P02State): void }) {
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
        <Instruction text={P02.instruction} verb={P02.verb} />
        <div className="mt-6 flex justify-end">
          <button type="submit" className="rounded-sm border border-ink px-6 py-2 font-serif text-[15px] active:bg-ink/10">
            제출
          </button>
        </div>
      </FormSheet>
    </form>
  );
}
