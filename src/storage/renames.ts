// 결과 ID 이름 바꾸기 표. 옛 ID → 새 ID.
// 작가가 docs/puzzles/에서 결과 ID를 바꾸면 여기에 한 줄 추가한다. 기존 기록이 그대로 살아남는다.
// 연쇄(a→b, b→c)는 읽을 때 끝까지 따라간다.

export const OUTCOME_RENAMES: Readonly<Record<string, string>> = {
  // 'p02.example-old': 'p02.example-new',
};

export function resolveRename(id: string, table: Readonly<Record<string, string>> = OUTCOME_RENAMES): string {
  let cur = id;
  const seen = new Set<string>();
  while (table[cur] !== undefined && !seen.has(cur)) {
    seen.add(cur);
    cur = table[cur]!;
  }
  return cur;
}
