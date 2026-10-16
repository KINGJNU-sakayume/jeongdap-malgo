// 대사 선택기. docs/spec/data-format.md 6-2. 난수 없이 결정적으로 고른다.
import type { Beat, LineSet, Variant } from './types';

export interface SelectContext {
  /** 화자 단계 0~5 */
  stage: number;
  /** 이 결과의 반복 횟수(1부터). 진입 대사·공용 대사는 1. */
  repeat: number;
  /** 누적으로 찾은 결과들(@if 판정용). */
  found: ReadonlySet<string>;
}

/** FNV-1a 32비트. 동점 교대용. */
export function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function matches(v: Variant, ctx: SelectContext): boolean {
  if (v.stage && (ctx.stage < v.stage[0] || ctx.stage > v.stage[1])) return false;
  if (v.repeat !== undefined) {
    if (v.repeat === 3 ? ctx.repeat < 3 : ctx.repeat !== v.repeat) return false;
  }
  if (v.ifFound !== undefined && !ctx.found.has(v.ifFound)) return false;
  return true;
}

export function score(v: Variant): number {
  return (v.ifFound !== undefined ? 4 : 0) + (v.repeat !== undefined ? 2 : 0) + (v.stage !== undefined ? 1 : 0);
}

/** 조건이 모두 맞는 변주 중 점수가 가장 높은 것. 동점은 hash(id:repeat) % n. 후보가 없으면 null. */
export function selectVariant(set: LineSet, ctx: SelectContext): Variant | null {
  const cands = set.variants.filter((v) => matches(v, ctx));
  if (cands.length === 0) return null;
  const best = Math.max(...cands.map(score));
  const top = cands.filter((v) => score(v) === best);
  return top[hash32(`${set.id}:${ctx.repeat}`) % top.length]!;
}

/**
 * {name}을 채운다. 이름이 없으면(새로고침 후 등) '선생님'으로.
 * '{name} 님'은 '선생님'으로 줄인다('선생님 님' 방지).
 */
export function fillName(text: string, name: string | null | undefined): string {
  if (name && name.trim()) return text.replaceAll('{name}', name.trim());
  return text.replaceAll('{name} 님', '선생님').replaceAll('{name}', '선생님');
}

export type LineBook = ReadonlyMap<string, LineSet>;

export function makeBook(sets: readonly LineSet[]): LineBook {
  return new Map(sets.map((s) => [s.id, s]));
}

/**
 * 결과 하나의 대사 비트. 대사가 없거나 @todo면 자리표시 비트 하나.
 * 화면에는 '[대사 미작성: 결과ID]'를 그대로 띄운다(CLAUDE.md 정본 규칙).
 */
export function beatsFor(book: LineBook, id: string, ctx: SelectContext, name?: string | null): Beat[] {
  const set = book.get(id);
  const v = set ? selectVariant(set, ctx) : null;
  if (!v || v.todo || v.beats.length === 0) return [{ text: `[대사 미작성: ${id}]`, pause: 'short' }];
  return v.beats.map((b) => ({ ...b, text: fillName(b.text, name) }));
}
