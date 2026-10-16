// 퍼즐 정의 자동 검사. docs/spec/data-format.md 7장(판정 쪽).
// 퍼즐마다 테스트를 손으로 쓰지 않는다. 이 함수가 오류 목록을 돌려주고, 테스트는 빈 목록인지만 본다.
import { checkEvents, judge } from './judge';
import type { PuzzleDef } from './types';

const ID_TAIL = /^(ok(-[a-z0-9]+)*|v-[a-z0-9-]+|e-[a-z0-9-]+|other|[a-z0-9]+(-[a-z0-9]+)*)$/;
const MIN_WRONG_PLUS_EVENT = 4;

function show(v: unknown): string {
  try {
    const s = JSON.stringify(v);
    return s.length > 120 ? s.slice(0, 117) + '…' : s;
  } catch {
    return String(v);
  }
}

export function validatePuzzle<S>(def: PuzzleDef<S>): string[] {
  const errs: string[] = [];
  const p = `[${def.id}]`;
  const rules = def.rules;
  const events = def.events ?? [];

  // 마지막 규칙은 other
  const last = rules[rules.length - 1];
  if (!last || last.kind !== 'other') errs.push(`${p} 마지막 규칙이 kind: 'other'가 아님`);
  if (rules.filter((r) => r.kind === 'other').length > 1) errs.push(`${p} other 규칙이 둘 이상`);
  if (!rules.some((r) => r.kind === 'correct')) errs.push(`${p} 정답 규칙이 없음`);

  // ID 형식, 중복
  const seen = new Set<string>();
  for (const id of [...rules.map((r) => r.outcome), ...events.map((e) => e.outcome)]) {
    if (seen.has(id)) errs.push(`${p} 결과 ID 중복: ${id}`);
    seen.add(id);
    const [pre, tail, ...rest] = id.split('.');
    if (pre !== def.prefix || tail === undefined || rest.length > 0 || !ID_TAIL.test(tail)) {
      errs.push(`${p} 결과 ID 형식 위반: ${id} (기대: ${def.prefix}.이름)`);
    }
  }
  for (const e of events) {
    if (!e.outcome.startsWith(`${def.prefix}.e-`)) errs.push(`${p} 이벤트 ID는 ${def.prefix}.e-로 시작: ${e.outcome}`);
  }

  // 틀림 수
  const wrongs = rules.filter((r) => r.kind === 'wrong').length;
  if (wrongs + events.length < MIN_WRONG_PLUS_EVENT) {
    errs.push(`${p} 틀림+이벤트가 ${wrongs + events.length}개 (최소 ${MIN_WRONG_PLUS_EVENT})`);
  }

  // 예시·반례
  for (const r of rules) {
    if (r.kind !== 'other' && r.examples.length === 0) errs.push(`${p} ${r.outcome}: 예시 없음(도달 가능성 증명 불가)`);
    for (const ex of r.examples) {
      let got: string;
      try {
        got = judge(def, ex).outcome;
      } catch (err) {
        got = `오류(${String(err)})`;
      }
      if (got !== r.outcome) errs.push(`${p} ${r.outcome} 예시가 ${got}로 판정됨: ${show(ex)}`);
    }
    for (const ex of r.notExamples ?? []) {
      if (judge(def, ex).outcome === r.outcome) errs.push(`${p} ${r.outcome} 반례가 ${r.outcome}로 판정됨: ${show(ex)}`);
    }
  }
  for (const e of events) {
    if (e.examples.length === 0) errs.push(`${p} ${e.outcome}: 예시 없음`);
    for (const ex of e.examples) {
      if (!checkEvents(def, ex, new Set()).includes(e.outcome)) errs.push(`${p} ${e.outcome} 예시에서 이벤트가 안 터짐: ${show(ex)}`);
    }
    for (const ex of e.notExamples ?? []) {
      if (checkEvents(def, ex, new Set()).includes(e.outcome)) errs.push(`${p} ${e.outcome} 반례에서 이벤트가 터짐: ${show(ex)}`);
    }
  }
  // 초기 상태에서 이벤트가 터지면 안 된다
  if (checkEvents(def, def.initial, new Set()).length > 0) errs.push(`${p} 초기 상태에서 이벤트가 터짐`);

  // 업적 텍스트: 틀림·이벤트·정답 변주에는 있고, 정답·기타에는 없음
  const needs = new Set([
    ...rules.filter((r) => r.kind === 'wrong' || r.kind === 'variant').map((r) => r.outcome),
    ...events.map((e) => e.outcome),
  ]);
  for (const id of needs) {
    const a = def.achievements[id];
    if (!a || !a.name.trim() || !a.desc.trim()) errs.push(`${p} ${id}: 업적 이름/설명 없음`);
  }
  for (const id of Object.keys(def.achievements)) {
    if (!needs.has(id)) errs.push(`${p} 업적이 틀림·이벤트·변주가 아닌 결과에 붙음: ${id}`);
  }

  return errs;
}
