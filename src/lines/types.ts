// 대사 타입. docs/spec/data-format.md 6장.

export interface Beat {
  text: string;
  /** 이 비트 뒤의 정지. */
  pause: 'short' | 'long';
}

export interface Variant {
  stage?: [number, number];
  /** 1, 2는 정확히 그 회차. 3은 3회 이상. */
  repeat?: 1 | 2 | 3;
  ifFound?: string;
  /** 대사 미작성 표시. 개발 중에만 허용. */
  todo?: boolean;
  beats: Beat[];
  /** 원본 위치(오류 메시지용). */
  line: number;
}

export interface LineSet {
  /** 결과 ID, 'pNN.@enter', 또는 '@'로 시작하는 공용 ID. */
  id: string;
  file: string;
  variants: Variant[];
}

export interface ParseError {
  file: string;
  line: number;
  message: string;
}
