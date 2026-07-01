import { MASTERY_INTERVAL_DAYS } from "@/lib/constants";
import type { MasteryLevel, SM2State } from "@/types";

export function getMasteryLevel(sm2: Pick<SM2State, "interval" | "repetitions">): MasteryLevel {
  if (sm2.repetitions === 0) {
    return "new";
  }

  if (sm2.repetitions < 3) {
    return "learning";
  }

  if (sm2.interval < MASTERY_INTERVAL_DAYS.reviewing) {
    return "reviewing";
  }

  return "mastered";
}

export function isMastered(sm2: Pick<SM2State, "interval">): boolean {
  return sm2.interval >= MASTERY_INTERVAL_DAYS.reviewing;
}
