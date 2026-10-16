import { describe, expect, it } from 'vitest';
import { PUZZLES } from '../puzzles';
import { autoAchievements, computeAchievements, makeOutcomeIndex, META_ACHIEVEMENTS, referencedOutcomes, type AchievementDef } from './achievements';
import { enter, event, reset, submit } from './__fixtures__/logs';

const ix = makeOutcomeIndex(PUZZLES);
const ALL = [...autoAchievements(PUZZLES), ...META_ACHIEVEMENTS];
const got = (log: Parameters<typeof computeAchievements>[0], defs: AchievementDef[] = ALL) => [...computeAchievements(log, defs, ix).keys()];

describe('업적', () => {
  it('틀림·이벤트·변주마다 자동 생성, 정답·기타에는 없음', () => {
    const ids = autoAchievements(PUZZLES).map((a) => a.id);
    expect(ids).toContain('a.p02.hong');
    expect(ids).toContain('a.p07.v-all');
    expect(ids).toContain('a.p04.e-dither');
    expect(ids).not.toContain('a.p02.ok');
    expect(ids).not.toContain('a.p02.other');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('업적 연결: 모든 조건이 존재하는 결과 ID만 가리킨다', () => {
    const bad = ALL.flatMap((a) => referencedOutcomes(a.cond).filter((id) => ix.classOf(id) === undefined).map((id) => `${a.id} → ${id}`));
    expect(bad).toEqual([]);
  });

  it('found: also와 이벤트로도 열린다. reset 뒤에도 유지(누적)', () => {
    const a = got([enter('p02'), submit('p02.empty', ['p02.robot']), reset(), event('p04.e-dither')]);
    expect(a).toEqual(expect.arrayContaining(['a.p02.empty', 'a.p02.robot', 'a.p04.e-dither']));
  });

  it('처음 참이 된 시각을 기록한다', () => {
    const log = [submit('p02.hong'), submit('p02.hong')];
    expect(computeAchievements(log, ALL, ix).get('a.p02.hong')).toBe(log[0]!.at);
  });

  it('알고 그랬죠: 같은 퍼즐 정답 바로 다음 제출이 틀림', () => {
    expect(got([submit('p02.ok'), submit('p02.hong')])).toContain('a.meta.knew-it');
    expect(got([submit('p07.v-all'), event('p07.e-read'), submit('p07.refuse')])).toContain('a.meta.knew-it');
    expect(got([submit('p02.ok'), submit('p04.none')])).not.toContain('a.meta.knew-it');
    expect(got([submit('p02.ok'), submit('p04.none'), submit('p02.hong')])).not.toContain('a.meta.knew-it');
    expect(got([submit('p02.ok'), submit('p02.other')])).not.toContain('a.meta.knew-it');
  });

  it('반려 사유 수집가: 서로 다른 틀림·이벤트 10개', () => {
    const nine = ['p02.empty', 'p02.hong', 'p02.literal', 'p02.clerk', 'p02.long', 'p02.robot', 'p04.both', 'p04.none'].map((o) => submit(o));
    expect(got([...nine, event('p04.e-dither')])).not.toContain('a.meta.collector');
    expect(got([...nine, event('p04.e-dither'), submit('p04.margin')])).toContain('a.meta.collector');
    expect(got([...nine, submit('p02.hong'), submit('p02.hong')])).not.toContain('a.meta.collector');
  });

  it('repeat·seq·foundAll·ending 조건', () => {
    const defs: AchievementDef[] = [
      { id: 'r', name: '', desc: '', hidden: true, cond: { repeat: 'p02.hong', n: 3 } },
      { id: 's', name: '', desc: '', hidden: true, cond: { seq: ['p02.ok', 'p02.hong'], samePuzzle: true } },
      { id: 'f', name: '', desc: '', hidden: true, cond: { foundAll: { puzzle: 'p04-checkbox', kind: 'event' } } },
      { id: 'e', name: '', desc: '', hidden: true, cond: { ending: 'A' } },
    ];
    expect(got([submit('p02.hong'), submit('p02.hong')], defs)).toEqual([]);
    expect(got([submit('p02.hong'), submit('p02.hong'), submit('p02.ok'), submit('p02.hong'), event('p04.e-dither'), { t: 'ending', at: 1, ending: 'A' }], defs).sort()).toEqual(['e', 'f', 'r', 's']);
  });
});
