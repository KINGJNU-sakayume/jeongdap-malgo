import { describe, expect, it } from 'vitest';
import { parseLines } from './parser';

const SRC = `# p02 성명

> 작가 메모는 무시

## p02.hong

홍길동 님이시군요. //
아, 예시를 그대로 쓰셨구나.
> 묶음 중간 메모도 무시
진짜 많이들 그러세요.

@repeat 2
또 오셨네요.

@stage 3-5 @repeat 1
홍길동. 네.

@if p15.fix
정정 요청 후에만.

## p02.@enter

성함 적어 주시면 됩니다.
`;

describe('대사 파서', () => {
  it('정상 파일을 읽는다', () => {
    const { sets, errors } = parseLines(SRC, 't.md');
    expect(errors).toEqual([]);
    expect(sets.map((s) => s.id)).toEqual(['p02.hong', 'p02.@enter']);
    const hong = sets[0]!;
    expect(hong.variants).toHaveLength(4);
    expect(hong.variants[0]!.beats).toEqual([
      { text: '홍길동 님이시군요.', pause: 'long' },
      { text: '아, 예시를 그대로 쓰셨구나.', pause: 'short' },
      { text: '진짜 많이들 그러세요.', pause: 'short' },
    ]);
    expect(hong.variants[1]!.repeat).toBe(2);
    expect(hong.variants[2]!.stage).toEqual([3, 5]);
    expect(hong.variants[2]!.repeat).toBe(1);
    expect(hong.variants[3]!.ifFound).toBe('p15.fix');
  });

  it('줄 중간의 //는 정지 표시가 아니다', () => {
    const { sets } = parseLines('## @x.y\n\n가//나', 't.md');
    expect(sets[0]!.variants[0]!.beats[0]).toEqual({ text: '가//나', pause: 'short' });
  });

  it('CRLF도 읽는다', () => {
    const { sets, errors } = parseLines('## @a\r\n\r\n하나 //\r\n둘\r\n', 't.md');
    expect(errors).toEqual([]);
    expect(sets[0]!.variants[0]!.beats[0]!.pause).toBe('long');
  });

  it('마지막 비트의 정지 표시는 무시한다', () => {
    const { sets } = parseLines('## @a\n\n하나 //\n둘 //\n\n@repeat 2\n셋 //', 't.md');
    expect(sets[0]!.variants[0]!.beats.map((b) => b.pause)).toEqual(['long', 'short']);
    expect(sets[0]!.variants[1]!.beats.map((b) => b.pause)).toEqual(['short']);
  });

  it('@todo만 있는 묶음은 기본 변주로 허용', () => {
    const { sets, errors } = parseLines('## p04.both\n\n@todo\n', 't.md');
    expect(errors).toEqual([]);
    expect(sets[0]!.variants[0]!.todo).toBe(true);
  });

  const bad: [string, string, string][] = [
    ['기본 변주 없음', '## p02.a\n\n@repeat 2\n또.', '기본 변주가 0개'],
    ['기본 변주 둘', '## p02.a\n\n하나.\n\n둘.', '기본 변주가 2개'],
    ['모르는 조건', '## p02.a\n\n기본.\n\n@stag 1-2\n뭐.', '모르는 조건'],
    ['단계 범위 거꾸로', '## p02.a\n\n기본.\n\n@stage 4-2\n뭐.', '거꾸로'],
    ['단계 6', '## p02.a\n\n기본.\n\n@stage 1-6\n뭐.', '@stage 형식'],
    ['repeat 4', '## p02.a\n\n기본.\n\n@repeat 4\n뭐.', '@repeat는'],
    ['if 대상 형식', '## p02.a\n\n기본.\n\n@if 아무거나\n뭐.', '@if 대상'],
    ['조건만 있고 비트 없음', '## p02.a\n\n기본.\n\n@repeat 2\n', '비트가 없음'],
    ['조건 줄이 묶음 중간', '## p02.a\n\n기본.\n@repeat 2\n뭐.', '묶음 첫 줄에만'],
    ['## 전에 내용', '안녕\n## p02.a\n\n기본.', "'## 결과ID' 전에"],
    ['ID 형식', '## P02.A\n\n기본.', '결과 ID 형식'],
    ['ID 중복', '## p02.a\n\n기본.\n\n## p02.a\n\n기본.', '중복'],
    ['다른 중괄호', '## p02.a\n\n{nick} 님.', '중괄호'],
  ];
  for (const [name, src, msg] of bad) {
    it(`오류: ${name}`, () => {
      const { errors } = parseLines(src, 'bad.md');
      expect(errors.map((e) => e.message).join('\n')).toContain(msg);
    });
  }

  it('오류에는 파일과 줄 번호가 붙는다', () => {
    const { errors } = parseLines('## p02.a\n\n기본.\n\n@stag 1\n뭐.', 'x.md');
    expect(errors[0]!.file).toBe('x.md');
    expect(errors[0]!.line).toBe(5);
  });
});
