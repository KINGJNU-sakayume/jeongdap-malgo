// 손으로 만든 기록 픽스처. 계산 함수 테스트용.
import type { LogEntry } from '../types';

let t = 1_000;
const at = () => (t += 1_000);

export const enter = (puzzle: string): LogEntry => ({ t: 'enter', at: at(), puzzle });
export const submit = (outcome: string, also: string[] = [], ms = 3_000): LogEntry => ({
  t: 'submit',
  at: at(),
  puzzle: outcome.split('.')[0]!,
  outcome,
  also,
  ms,
});
export const event = (outcome: string): LogEntry => ({ t: 'event', at: at(), puzzle: outcome.split('.')[0]!, outcome });
export const reset = (): LogEntry => ({ t: 'reset', at: at() });

/** P02에서 홍길동 두 번, 빈칸, 정답, reset 후 홍길동 한 번. */
export const SAMPLE: LogEntry[] = [
  enter('p02'),
  submit('p02.hong'),
  submit('p02.hong'),
  submit('p02.empty'),
  submit('p02.ok'),
  enter('p12'),
  submit('p12.clerk', ['p12.spam']),
  event('p07.e-read'),
  reset(),
  enter('p02'),
  submit('p02.hong'),
];
