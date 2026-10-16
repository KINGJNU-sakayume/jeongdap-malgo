// 이 빌드의 업적 목록과 결과 색인. 구현된 퍼즐에서 자동 생성 + 메타 업적.
import { autoAchievements, makeOutcomeIndex, META_ACHIEVEMENTS, type AchievementDef } from './log/achievements';
import { PUZZLES } from './puzzles';

export const ACHIEVEMENTS: readonly AchievementDef[] = [...autoAchievements(PUZZLES), ...META_ACHIEVEMENTS];
export const OUTCOME_INDEX = makeOutcomeIndex(PUZZLES);
