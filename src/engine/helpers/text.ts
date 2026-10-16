// 텍스트 판정 도우미. 판정 규칙은 이 함수들의 조합으로만 쓴다.

/** 앞뒤 공백 제거 + 내부 공백 제거. docs/puzzles/p02-name.md '정규화'. */
export function norm(s: string): string {
  return s.replace(/\s+/g, '');
}

/** 한글 완성형(가-힣) 또는 영문자가 하나라도 있는가. 자모(ㅋ)만 있으면 false. */
export function hasHangulOrLatin(s: string): boolean {
  return /[가-힣a-zA-Z]/.test(s);
}

/** norm 후 목록 안에 있는가. 목록 쪽도 norm한다. */
export function inList(s: string, list: readonly string[]): boolean {
  const n = norm(s);
  return list.some((x) => norm(x) === n);
}

/** 앞뒤 공백을 뺀 길이(코드 포인트 기준). */
export function trimmedLength(s: string): number {
  return [...s.trim()].length;
}
