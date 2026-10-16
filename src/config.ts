// 조정값. 플레이테스트로 바꾸는 숫자는 전부 여기에 둔다.

/**
 * 화자 단계 임계값. 누적으로 찾은 서로 다른 틀림(이벤트 포함) 수 D가
 * 각 값 이상이면 한 단계씩 오른다. 프로토타입(퍼즐 5개, 틀림+이벤트 40개) 기준 축소값.
 * 정식(퍼즐 15개) 기준 첫 안: [3, 10, 20, 35, 55]  (docs/spec/data-format.md 5-4)
 */
export const STAGE_THRESHOLDS: readonly number[] = [2, 5, 9, 14, 20];

/** 단계 상한. 정식에서는 '가장 먼 장'이 상한이지만, 프로토타입은 장 구조가 없어 5로 고정. */
export const STAGE_CAP_PROTOTYPE = 5;

/** 최근 제출이 이 개수만큼 연속 정답이면 한 단계 낮게 말한다. */
export const COOL_STREAK = 3;

/** 비트 뒤 정지 시간(ms). */
export const PAUSE_MS = { short: 500, long: 1200 } as const;

/** 판정 후 첫 비트까지 지연(ms). 300 이하. */
export const FIRST_BEAT_DELAY_MS = 300;

/** 비트 타이핑 속도(ms/글자). 아주 빠르게(data-format.md 6-3). */
export const TYPE_MS_PER_CHAR = 20;

/** 비트 하나 최대 글자 수(모바일 두 줄 기준). */
export const BEAT_MAX_CHARS = 60;
