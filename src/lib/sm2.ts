import { addDays } from "@/lib/date";
import type { SM2State } from "@/types";

export const INITIAL_SM2_STATE: SM2State = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  nextReview: new Date(0),
};

export function calculateSM2(
  currentState: Pick<SM2State, "easeFactor" | "interval" | "repetitions">,
  quality: 1 | 3 | 5,
  studiedAt = new Date(),
): SM2State {
  let { easeFactor, interval, repetitions } = currentState;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }

    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(1.3, Number(easeFactor.toFixed(2)));

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview: addDays(studiedAt, interval),
  };
}
