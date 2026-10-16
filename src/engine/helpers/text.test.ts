import { describe, expect, it } from 'vitest';
import { hasHangulOrLatin, inList, norm, trimmedLength } from './text';

describe('텍스트 도우미', () => {
  it('norm은 모든 공백을 지운다', () => {
    expect(norm(' 홍 길\t동 \n')).toBe('홍길동');
    expect(norm('')).toBe('');
  });

  it('hasHangulOrLatin', () => {
    expect(hasHangulOrLatin('김1')).toBe(true);
    expect(hasHangulOrLatin('Alex')).toBe(true);
    expect(hasHangulOrLatin('1234')).toBe(false);
    expect(hasHangulOrLatin('ㅋㅋ')).toBe(false);
    expect(hasHangulOrLatin('★★')).toBe(false);
  });

  it('inList는 양쪽을 정규화한다', () => {
    expect(inList('성 명', ['성명'])).toBe(true);
    expect(inList('이름이', ['이름'])).toBe(false);
  });

  it('trimmedLength는 코드 포인트 기준', () => {
    expect(trimmedLength('  가나다  ')).toBe(3);
    expect(trimmedLength('😀😀')).toBe(2);
  });
});
