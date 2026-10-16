import { describe, expect, it } from 'vitest';
import { P02 } from '../puzzles/p02';
import { P07 } from '../puzzles/p07';
import { event, submit } from './__fixtures__/logs';
import { answeredCorrectly, isSealed, rejectsFound } from './progress';

describe('대기석 진행도', () => {
  it('반려 수는 서로 다른 틀림·이벤트(also 포함)', () => {
    expect(rejectsFound([submit('p02.empty', ['p02.robot']), submit('p02.empty'), submit('p02.ok')], P02)).toBe(2);
    expect(rejectsFound([submit('p07.ok'), event('p07.e-read')], P07)).toBe(1);
  });

  it('전수 확인은 틀림·이벤트·변주 전부', () => {
    const wrongs = ['p02.empty', 'p02.hong', 'p02.literal', 'p02.clerk', 'p02.long'].map((o) => submit(o));
    expect(isSealed(wrongs, P02)).toBe(false);
    expect(isSealed([...wrongs, submit('p02.robot')], P02)).toBe(true);
    const p07 = ['p07.refuse', 'p07.pick', 'p07.prayer', 'p07.missing'].map((o) => submit(o));
    expect(isSealed([...p07, event('p07.e-read'), event('p07.e-toggle')], P07)).toBe(false);
    expect(isSealed([...p07, event('p07.e-read'), event('p07.e-toggle'), submit('p07.v-all')], P07)).toBe(true);
  });

  it('정답 처리는 주 결과 기준(also로 걸친 정답은 아님)', () => {
    expect(answeredCorrectly([submit('p02.hong', ['p02.ok'])], P02)).toBe(false);
    expect(answeredCorrectly([submit('p02.ok')], P02)).toBe(true);
    expect(answeredCorrectly([submit('p07.v-all')], P07)).toBe(true);
  });
});
