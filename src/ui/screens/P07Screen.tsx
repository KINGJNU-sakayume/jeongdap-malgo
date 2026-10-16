// P07 약관 화면. 정본: docs/puzzles/p07-terms.md '화면'. 본문: content/forms/p07-terms.md(그대로 렌더).
import { FORMS } from '../../content';
import { P07, type P07State } from '../../puzzles/p07';
import { CheckWidget } from '../../widgets/CheckWidget';
import { ScrollWidget } from '../../widgets/ScrollWidget';
import { FormSheet } from '../FormSheet';
import { Instruction } from '../Instruction';
import type { PuzzleScreen, ScreenProps } from './types';

/** 본문 첫 줄(약관 제목)은 서식 제목으로, 나머지는 스크롤 상자에. 글자는 그대로. */
const [TITLE = '', ...REST] = FORMS.p07Terms.replace(/\r\n?/g, '\n').split('\n');
const BODY = REST.join('\n').trim();

/** 본문 상자 높이 = 본문 전체 길이의 25% 이하 */
const BOX_RATIO = 0.25;

type Item = 'req1' | 'req2' | 'mkt' | 'offwork';
const ITEMS: { key: Item; label: string }[] = [
  { key: 'req1', label: '[필수] 서비스 이용약관 동의' },
  { key: 'req2', label: '[필수] 개인정보 수집·이용 동의' },
  { key: 'mkt', label: '[선택] 마케팅 정보 수신 동의 (발신: 제1정답처리과)' },
  { key: 'offwork', label: '[선택] 담당 주무관 정시 퇴근 기원 동의' },
];

const allOn = (s: P07State) => s.req1 && s.req2 && s.mkt && s.offwork;

function P07Screen({ state, setState, onSubmit }: ScreenProps<P07State>) {
  // 전체 동의: 켜면 넷 다 켬, 끄면 넷 다 끔. 넷이 다 켜져 있으면 자동으로 체크 표시.
  const toggleAll = () =>
    setState((s) => {
      const on = !allOn(s);
      return { ...s, req1: on, req2: on, mkt: on, offwork: on, allPressed: s.allPressed || on, toggles: s.toggles + 1 };
    });
  const toggle = (k: Item) => setState((s) => ({ ...s, [k]: !s[k], toggles: s.toggles + 1 }));

  return (
    <div>
      <FormSheet title={TITLE}>
        <ScrollWidget max={state.scrollMax} onReach={(r) => setState((s) => ({ ...s, scrollMax: Math.max(s.scrollMax, r) }))} heightRatio={BOX_RATIO}>
          <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{BODY}</div>
        </ScrollWidget>
        <div className="mt-3 flex flex-col">
          <CheckWidget checked={allOn(state)} onToggle={toggleAll}>
            <span className="font-semibold">전체 동의</span>
          </CheckWidget>
          {ITEMS.map((it) => (
            <CheckWidget key={it.key} checked={state[it.key]} onToggle={() => toggle(it.key)}>
              {it.label}
            </CheckWidget>
          ))}
        </div>
        <Instruction text={P07.instruction} verb={P07.verb} />
        <div className="mt-6 flex justify-between">
          <button type="button" onClick={() => onSubmit({ ...state, button: 'refuse' })} className="rounded-sm border border-ink/50 px-4 py-2 font-serif text-[15px] text-ink/80 active:bg-ink/10">
            동의하지 않음
          </button>
          <button type="button" onClick={() => onSubmit({ ...state, button: 'next' })} className="rounded-sm border border-ink px-6 py-2 font-serif text-[15px] active:bg-ink/10">
            다음
          </button>
        </div>
      </FormSheet>
    </div>
  );
}

export const P07_SCREEN: PuzzleScreen<P07State> = {
  def: P07,
  Screen: P07Screen,
  afterSubmit: (s) => ({ ...s, button: 'next' }),
};
