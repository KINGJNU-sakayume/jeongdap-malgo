import type { ComponentType, Dispatch, SetStateAction } from 'react';
import type { PuzzleDef } from '../../engine/types';

export interface ScreenProps<S> {
  state: S;
  setState: Dispatch<SetStateAction<S>>;
  /** 제출. 버튼이 여럿인 퍼즐은 누른 버튼을 상태에 넣어서 부른다. */
  onSubmit(s: S): void;
}

export interface PuzzleScreen<S> {
  def: PuzzleDef<S>;
  Screen: ComponentType<ScreenProps<S>>;
  /** 제출 직후 상태. 원시 입력(자유 입력)은 여기서 버린다. */
  afterSubmit(s: S): S;
  /** 정답일 때 {name}으로 둘 값(P02만). */
  nameOf?(s: S): string;
  /** 화자 아이콘 이마의 인영 수(P12만). */
  clerkMarks?(s: S): number;
  /** 디버그 패널에 보일 상태 요약(기본: 상태 그대로). */
  debugView?(s: S): unknown;
}
