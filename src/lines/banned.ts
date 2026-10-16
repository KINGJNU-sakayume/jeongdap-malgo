// 금지어. docs/narrator-bible.md 7장. 대사 검사가 쓴다.

/** 어떤 단계에서도 금지. */
export const BANNED_ALWAYS: readonly string[] = [
  '맘충',
  '급식충',
  '틀딱',
  '죽겠',
  '죽고 싶',
  '뛰어내리',
  '눈이 없',
  '머리가 나쁘',
  '바보',
  '멍청',
];

/** S3 전에는 금지(감정 직접 서술). 변주의 단계 하한이 3 이상이면 허용. */
export const BANNED_BEFORE_S3: readonly string[] = ['화났', '화가 나', '짜증 나', '짜증나'];
