// content/lines/*.md 전체 검사. docs/spec/data-format.md 7장(대사 쪽), CLAUDE.md 테스트 규칙.
// 작가가 대사를 고치면 이 테스트가 누락·형식·금지어를 잡는다.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LINE_SOURCES, parseAllLines } from '../content';
import { BEAT_MAX_CHARS } from '../config';
import { PUZZLES } from '../puzzles';
import { BANNED_ALWAYS, BANNED_BEFORE_S3 } from './banned';

const { sets, errors } = parseAllLines();
const ids = new Set(sets.map((s) => s.id));
const where = (file: string, line: number) => `${file}:${line}`;

describe('대사 파일', () => {
  it('content/lines의 모든 파일이 src/content.ts에 등록돼 있다', () => {
    const onDisk = readdirSync('content/lines').filter((f) => f.endsWith('.md')).sort();
    expect(LINE_SOURCES.map((s) => s.file).sort()).toEqual(onDisk);
  });

  it('파싱 오류가 없다', () => {
    expect(errors.map((e) => `${where(e.file, e.line)} ${e.message}`)).toEqual([]);
  });

  it('결과 ID가 파일 사이에서도 겹치지 않는다', () => {
    const dup = sets.map((s) => s.id).filter((id, i, a) => a.indexOf(id) !== i);
    expect(dup).toEqual([]);
  });

  it('@if 대상은 대사가 있는 결과 ID다', () => {
    const bad = sets.flatMap((s) =>
      s.variants.filter((v) => v.ifFound && !ids.has(v.ifFound)).map((v) => `${where(s.file, v.line)} @if ${v.ifFound}`),
    );
    expect(bad).toEqual([]);
  });

  it(`비트 하나는 ${BEAT_MAX_CHARS}자 이하`, () => {
    const long = sets.flatMap((s) =>
      s.variants.flatMap((v) =>
        v.beats.filter((b) => [...b.text].length > BEAT_MAX_CHARS).map((b) => `${where(s.file, v.line)} (${[...b.text].length}자) ${b.text}`),
      ),
    );
    expect(long).toEqual([]);
  });

  it('금지어가 없다', () => {
    const hits: string[] = [];
    for (const s of sets) {
      for (const v of s.variants) {
        const minStage = v.stage?.[0] ?? 0;
        for (const b of v.beats) {
          for (const w of BANNED_ALWAYS) if (b.text.includes(w)) hits.push(`${where(s.file, v.line)} '${w}': ${b.text}`);
          if (minStage < 3) for (const w of BANNED_BEFORE_S3) if (b.text.includes(w)) hits.push(`${where(s.file, v.line)} S3 전 '${w}': ${b.text}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it('화자 단계 전환 대사 1~5가 있다', () => {
    for (const n of [1, 2, 3, 4, 5]) expect(ids.has(`@stage-up.${n}`)).toBe(true);
  });

  for (const p of PUZZLES) {
    it(`${p.id}: 모든 결과와 진입에 대사가 있다`, () => {
      const need = [`${p.prefix}.@enter`, ...p.rules.map((r) => r.outcome), ...(p.events ?? []).map((e) => e.outcome)];
      expect(need.filter((id) => !ids.has(id))).toEqual([]);
    });

    it(`${p.id}: 정의에 없는 결과의 대사가 없다`, () => {
      const known = new Set([`${p.prefix}.@enter`, ...p.rules.map((r) => r.outcome), ...(p.events ?? []).map((e) => e.outcome)]);
      const orphan = sets.filter((s) => s.id.startsWith(`${p.prefix}.`) && !known.has(s.id)).map((s) => s.id);
      expect(orphan).toEqual([]);
    });
  }

  // 퍼즐 문서(정본)의 결과 표·이벤트 표에 있는 결과 ID. 아직 구현 안 된 퍼즐도 대사는 미리 검사한다.
  const docDir = 'docs/puzzles';
  const docIds = readdirSync(docDir)
    .filter((f) => /^p\d{2}-.*\.md$/.test(f))
    .map((f) => ({
      file: f,
      prefix: f.slice(0, 3),
      ids: [...readFileSync(`${docDir}/${f}`, 'utf8').matchAll(/^\|\s*(?:\d+\s*\|\s*)?`?(p\d{2}\.[a-z0-9-]+)`?\s*\|/gm)].map((m) => m[1]!),
    }));

  for (const d of docIds) {
    it(`${d.file}: 문서의 모든 결과 ID에 대사가 있고, 문서에 없는 결과의 대사가 없다`, () => {
      expect(d.ids.length).toBeGreaterThan(0);
      expect(d.ids.filter((id) => !ids.has(id))).toEqual([]);
      const known = new Set(d.ids);
      expect(sets.filter((s) => s.id.startsWith(`${d.prefix}.`) && !s.id.includes('@') && !known.has(s.id)).map((s) => s.id)).toEqual([]);
    });
  }

  it('repeat 1 변주가 있는 결과는 2·3회 변주도 있다 (없으면 경고만)', () => {
    for (const s of sets) {
      const reps = new Set(s.variants.map((v) => v.repeat));
      if (reps.has(1) && !(reps.has(2) && reps.has(3))) console.warn(`[lines] ${s.file} ${s.id}: @repeat 1은 있는데 2·3회 변주가 없음`);
    }
  });

  it('배포 빌드에서는 @todo가 없어야 한다 (JDM_RELEASE=1일 때만 검사)', () => {
    if (process.env.JDM_RELEASE !== '1') return;
    const todos = sets.flatMap((s) => s.variants.filter((v) => v.todo).map((v) => `${where(s.file, v.line)} ${s.id}`));
    expect(todos).toEqual([]);
  });
});
