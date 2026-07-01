import type {
  AnswerValue,
  CandidateWord,
  Flashcard,
  LanguageCode,
  ProficiencyLevel,
  ThemeId,
} from "@/types";

export interface GenerateStudyTextRequest {
  themeId: ThemeId;
  targetLang: LanguageCode;
  nativeLang: LanguageCode;
  level: ProficiencyLevel;
}

export interface GenerateStudyTextResponse {
  textId: string;
  text: string;
  candidateWords: CandidateWord[];
}

export interface AddWordToLanguageDeckRequest {
  textId: string;
  sourceThemeId: ThemeId;
  targetLang: LanguageCode;
  nativeLang: LanguageCode;
  word: string;
  translation?: string;
}

export interface AddWordToLanguageDeckResponse {
  cardId: string;
  created: boolean;
  card: Flashcard;
}

export interface CreateStudySessionRequest {
  targetLang: LanguageCode;
  mode: "new" | "review" | "mixed";
  limit?: number;
}

export interface CreateStudySessionResponse {
  sessionId: string;
  cards: Flashcard[];
}

export interface GetReviewCardsRequest {
  targetLang: LanguageCode;
  limit?: number;
}

export interface GetReviewCardsResponse {
  reviewCards: Flashcard[];
  count: number;
  nextReviewDate: string | null;
}

export interface SubmitCardAnswerRequest {
  targetLang: LanguageCode;
  cardId: string;
  answer: AnswerValue;
  timezone: string;
}

export interface SubmitCardAnswerResponse {
  xpEarned: number;
  xpTotal: number;
  currentStreak: number;
  nextCardIndex: number;
  deckCompleted: boolean;
}

export interface DeleteAccountResponse {
  deleted: boolean;
}
