import { describe, expect, it } from 'vitest';
import { parseLines } from './parser';
import { beatsFor, fillName, hash32, makeBook, selectVariant } from './select';

const { sets } = parseLines(
  `## p02.hong

기본.

@repeat 1
일회.

@repeat 2
이회.

@repeat 3
삼회 이상.

@stage 3-5
지침.

@stage 3-5 @repeat 1
지친 일회.

@if p15.fix
콜백.

## @rot

기본.

@stage 1-5
가.

@stage 1-5
나.

## p04.both

@todo

## p02.ok

{name} 님. //
반가워요, {name}.
`,
  't.md',
);
const set = (id: string) => sets.find((s) => s.id === id)!;
const pick = (id: string, stage: number, repeat: number, found: string[] = []) =>
  selectVariant(set(id), { stage, repeat, found: new Set(found) })?.beats.map((b) => b.text).join(' ');

describe('대사 선택', () => {
  it('점수: if(4) > repeat(2) > stage(1) > 기본(0), 합산', () => {
    expect(pick('p02.hong', 0, 1)).toBe('일회.');
    expect(pick('p02.hong', 4, 1)).toBe('지친 일회.'); // 3점 > 2점
    expect(pick('p02.hong', 4, 2)).toBe('이회.'); // repeat 2(2점) > stage(1점)
    expect(pick('p02.hong', 0, 7)).toBe('삼회 이상.');
    expect(pick('p02.hong', 4, 1, ['p15.fix'])).toBe('콜백.');
  });

  it('repeat 1·2는 정확히, 3은 이상', () => {
    expect(pick('p02.hong', 0, 3)).toBe('삼회 이상.');
    expect(pick('p02.hong', 0, 2)).toBe('이회.');
  });

  it('맞는 변주가 기본뿐이면 기본', () => {
    expect(pick('@rot', 0, 1)).toBe('기본.');
  });

  it('동점은 결정적으로 고르고, 반복 횟수에 따라 교대할 수 있다', () => {
    const a = pick('@rot', 2, 1);
    expect(a).toBe(pick('@rot', 2, 1));
    const seen = new Set([1, 2, 3, 4, 5, 6].map((r) => pick('@rot', 2, r)));
    expect([...seen].every((x) => x === '가.' || x === '나.')).toBe(true);
  });

  it('hash32는 고정값', () => {
    expect(hash32('')).toBe(0x811c9dc5);
    expect(hash32('a')).toBe(hash32('a'));
    expect(hash32('a')).not.toBe(hash32('b'));
  });
});

describe('beatsFor', () => {
  const book = makeBook(sets);
  const ctx = { stage: 0, repeat: 1, found: new Set<string>() };

  it('이름을 채운다', () => {
    expect(beatsFor(book, 'p02.ok', ctx, '김민지').map((b) => b.text)).toEqual(['김민지 님.', '반가워요, 김민지.']);
  });

  it('이름이 없으면 선생님(선생님 님 방지)', () => {
    expect(beatsFor(book, 'p02.ok', ctx, null).map((b) => b.text)).toEqual(['선생님.', '반가워요, 선생님.']);
  });

  it('없는 대사와 @todo는 자리표시', () => {
    expect(beatsFor(book, 'p09.none', ctx)[0]!.text).toBe('[대사 미작성: p09.none]');
    expect(beatsFor(book, 'p04.both', ctx)[0]!.text).toBe('[대사 미작성: p04.both]');
  });

  it('정지 정보는 유지', () => {
    expect(beatsFor(book, 'p02.ok', ctx, '김')[0]!.pause).toBe('long');
  });

  it('fillName', () => {
    expect(fillName('{name} 님, {name}', '  ')).toBe('선생님, 선생님');
  });
});
