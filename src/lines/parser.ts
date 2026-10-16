// 대사 파일 파서. 문법: docs/puzzle-authoring.md 5장.
//
//   # 제목            무시
//   > 메모            무시(묶음을 끊지 않음)
//   ## 결과ID         결과 하나의 시작
//   (빈 줄)           묶음 구분
//   @stage a-b @repeat n @if 결과ID @todo     묶음 첫 줄일 때만 조건
//   그 밖의 줄        비트. 끝이 ' //'면 긴 정지
//
// 오류는 던지지 않고 모아서 돌려준다. 테스트·빌드가 오류 목록이 비었는지 본다.

import type { Beat, LineSet, ParseError, Variant } from './types';

export const SET_ID = /^(p\d{2}\.(@enter|[a-z0-9]+(-[a-z0-9]+)*)|@[a-z0-9]+([.-][a-z0-9]+)*)$/;
const OUTCOME_ID = /^p\d{2}\.[a-z0-9]+(-[a-z0-9]+)*$/;

interface Block {
  start: number;
  cond: Omit<Variant, 'beats' | 'line'> | null;
  beats: Beat[];
}

function parseCondition(line: string): { cond: Omit<Variant, 'beats' | 'line'>; error?: string } {
  const cond: Omit<Variant, 'beats' | 'line'> = {};
  const tok = line.trim().split(/\s+/);
  for (let i = 0; i < tok.length; i++) {
    const t = tok[i]!;
    const arg = tok[i + 1];
    if (t === '@stage') {
      if (cond.stage) return { cond, error: '@stage 중복' };
      const m = arg?.match(/^([0-5])-([0-5])$/);
      if (!m) return { cond, error: `@stage 형식은 a-b(0~5): ${arg ?? '(없음)'}` };
      const a = Number(m[1]);
      const b = Number(m[2]);
      if (a > b) return { cond, error: `@stage 범위가 거꾸로: ${arg}` };
      cond.stage = [a, b];
      i++;
    } else if (t === '@repeat') {
      if (cond.repeat) return { cond, error: '@repeat 중복' };
      if (arg !== '1' && arg !== '2' && arg !== '3') return { cond, error: `@repeat는 1, 2, 3: ${arg ?? '(없음)'}` };
      cond.repeat = Number(arg) as 1 | 2 | 3;
      i++;
    } else if (t === '@if') {
      if (cond.ifFound) return { cond, error: '@if 중복' };
      if (!arg || !OUTCOME_ID.test(arg)) return { cond, error: `@if 대상이 결과 ID가 아님: ${arg ?? '(없음)'}` };
      cond.ifFound = arg;
      i++;
    } else if (t === '@todo') {
      cond.todo = true;
    } else {
      return { cond, error: `모르는 조건: ${t}` };
    }
  }
  return { cond };
}

function parseBeat(raw: string): { beat?: Beat; error?: string } {
  let text = raw.trim();
  let pause: Beat['pause'] = 'short';
  if (/\s\/\/$/.test(text)) {
    pause = 'long';
    text = text.replace(/\s*\/\/$/, '').trim();
  }
  if (text === '') return { error: '빈 비트' };
  if (/[{}]/.test(text.replaceAll('{name}', ''))) return { error: `{name} 외 중괄호 금지: ${text}` };
  return { beat: { text, pause } };
}

const hasCond = (c: Variant) => c.stage !== undefined || c.repeat !== undefined || c.ifFound !== undefined;

export function parseLines(src: string, file: string): { sets: LineSet[]; errors: ParseError[] } {
  const sets: LineSet[] = [];
  const errors: ParseError[] = [];
  const err = (line: number, message: string) => errors.push({ file, line, message });

  let cur: LineSet | null = null;
  let block: Block | null = null;

  const closeBlock = () => {
    if (!cur || !block) {
      block = null;
      return;
    }
    if (block.beats.length === 0 && !block.cond?.todo) {
      err(block.start, '조건 줄 뒤에 비트가 없음');
    } else {
      // 마지막 비트의 정지 표시는 무시한다(puzzle-authoring.md 5장).
      const last = block.beats[block.beats.length - 1];
      if (last) last.pause = 'short';
      cur.variants.push({ ...(block.cond ?? {}), beats: block.beats, line: block.start });
    }
    block = null;
  };

  const closeSet = () => {
    closeBlock();
    if (!cur) return;
    if (cur.variants.length === 0) err(0, `${cur.id}: 묶음이 하나도 없음`);
    const defaults = cur.variants.filter((v) => !hasCond(v)).length;
    if (defaults !== 1) err(cur.variants[0]?.line ?? 0, `${cur.id}: 기본 변주가 ${defaults}개 (정확히 1개여야 함)`);
    sets.push(cur);
    cur = null;
  };

  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  lines.forEach((raw, idx) => {
    const n = idx + 1;
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) {
      closeSet();
      const id = trimmed.slice(3).trim();
      if (!SET_ID.test(id)) err(n, `결과 ID 형식 위반: ${id}`);
      if (sets.some((s) => s.id === id)) err(n, `같은 파일 안 결과 ID 중복: ${id}`);
      cur = { id, file, variants: [] };
      return;
    }
    if (trimmed.startsWith('# ') || trimmed === '#') return;
    if (trimmed.startsWith('>')) return;
    if (trimmed === '') {
      closeBlock();
      return;
    }
    if (!cur) {
      err(n, `'## 결과ID' 전에 내용이 있음: ${trimmed}`);
      return;
    }
    if (trimmed.startsWith('@')) {
      if (block && (block.beats.length > 0 || block.cond)) {
        err(n, '조건 줄은 묶음 첫 줄에만 (앞에 빈 줄 필요)');
        return;
      }
      const { cond, error } = parseCondition(trimmed);
      if (error) err(n, error);
      block = { start: n, cond, beats: [] };
      return;
    }
    if (!block) block = { start: n, cond: null, beats: [] };
    const { beat, error } = parseBeat(trimmed);
    if (error) err(n, error);
    else block.beats.push(beat!);
  });
  closeSet();

  return { sets, errors };
}
