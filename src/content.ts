// 콘텐츠 원본 목록. content/ 아래 파일을 빌드 시 문자열로 읽는다(Vite ?raw).
// 대사 파일을 추가하면 여기에도 추가한다. 빠뜨리면 테스트가 잡는다.
import narrator from '../content/lines/_narrator.md?raw';
import p02 from '../content/lines/p02.md?raw';
import p04 from '../content/lines/p04.md?raw';
import p06 from '../content/lines/p06.md?raw';
import p07 from '../content/lines/p07.md?raw';
import p12 from '../content/lines/p12.md?raw';
import p07Terms from '../content/forms/p07-terms.md?raw';

import { parseLines } from './lines/parser';
import { makeBook, type LineBook } from './lines/select';
import type { LineSet, ParseError } from './lines/types';

export const LINE_SOURCES: readonly { file: string; src: string }[] = [
  { file: '_narrator.md', src: narrator },
  { file: 'p02.md', src: p02 },
  { file: 'p04.md', src: p04 },
  { file: 'p06.md', src: p06 },
  { file: 'p07.md', src: p07 },
  { file: 'p12.md', src: p12 },
];

export const FORMS = {
  p07Terms,
} as const;

export function parseAllLines(): { sets: LineSet[]; errors: ParseError[] } {
  const sets: LineSet[] = [];
  const errors: ParseError[] = [];
  for (const { file, src } of LINE_SOURCES) {
    const r = parseLines(src, file);
    sets.push(...r.sets);
    errors.push(...r.errors);
  }
  return { sets, errors };
}

/** 앱 시작 시 한 번. 파싱 오류는 테스트에서 막히므로 여기서는 콘솔 경고만. */
export function loadLineBook(): LineBook {
  const { sets, errors } = parseAllLines();
  if (errors.length > 0) console.warn('[lines] 대사 파싱 오류', errors);
  return makeBook(sets);
}
