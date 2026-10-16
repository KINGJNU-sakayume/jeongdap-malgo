// 효과음. Web Audio로 합성, 음원 파일 없음(D-004).
// AudioContext는 처음 소리를 낼 때(= 사용자 입력 이벤트 안) 만든다. 모바일 자동재생 제약.
import { settings } from '../storage/settings';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (settings.get().muted) return null;
  try {
    if (!ctx) {
      const AC = globalThis.AudioContext ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function noise(c: AudioContext, seconds: number): AudioBuffer {
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * seconds)), c.sampleRate);
  const d = buf.getChannelData(0);
  // 결정적 잡음(난수 대신 간단한 LCG). 소리 모양만 필요하다.
  let x = 12345;
  for (let i = 0; i < d.length; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    d[i] = (x / 0x7fffffff) * 2 - 1;
  }
  return buf;
}

/** 체크박스 딸깍. */
export function playClick(): void {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noise(c, 0.03);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 3200;
  bp.Q.value = 4;
  const g = c.createGain();
  g.gain.setValueAtTime(0.6, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  src.connect(bp).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + 0.04);
}

/**
 * 도장 쾅. n은 이번 진입에서 몇 번째 찍기인지(1부터).
 * 10번째부터 점점 작게(인주 고갈 연출, p12-stamp.md '효과음').
 */
export function playStamp(n = 1): void {
  const c = audio();
  if (!c) return;
  const vol = n < 10 ? 1 : Math.max(0.15, 1 - (n - 9) * 0.12);
  const t = c.currentTime;
  // 낮은 쿵
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(55, t + 0.12);
  const og = c.createGain();
  og.gain.setValueAtTime(0.9 * vol, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  o.connect(og).connect(c.destination);
  o.start(t);
  o.stop(t + 0.2);
  // 종이 닿는 소리
  const src = c.createBufferSource();
  src.buffer = noise(c, 0.06);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1800;
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.35 * vol, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  src.connect(lp).connect(ng).connect(c.destination);
  src.start(t);
  src.stop(t + 0.07);
}
