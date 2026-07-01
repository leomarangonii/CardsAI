import { ANSWER_CONFIG } from "@/lib/constants";
import type { AnswerValue } from "@/types";

export function getXpForAnswer(answer: AnswerValue): number {
  return ANSWER_CONFIG[answer].xp;
}

export function getQualityForAnswer(answer: AnswerValue): 1 | 3 | 5 {
  return ANSWER_CONFIG[answer].quality;
}

export function sumSessionXp(answers: AnswerValue[]): number {
  return answers.reduce((total, answer) => total + getXpForAnswer(answer), 0);
}
