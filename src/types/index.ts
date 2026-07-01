export type LanguageCode = "pt" | "en" | "es" | "fr" | "de" | "it";

export type ProficiencyLevel = "beginner" | "intermediate" | "advanced";

export type ThemeId =
  | "tech"
  | "travel"
  | "food"
  | "business"
  | "sports"
  | "movies"
  | "music"
  | "nature"
  | "daily";

export type AnswerValue = "know" | "almost" | "dont";

export type MasteryLevel = "new" | "learning" | "reviewing" | "mastered";

export type ThemePreference = "light" | "dark";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  shortLabel: string;
}

export interface LevelOption {
  id: ProficiencyLevel;
  icon: string;
  label: string;
  description: string;
}

export interface ThemeOption {
  id: ThemeId;
  emoji: string;
  label: string;
  description: string;
}

export interface CardsAIUserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  nativeLang: LanguageCode;
  targetLang: LanguageCode;
  level: ProficiencyLevel;
  onboardingCompleted: boolean;
  timezone: string;
  theme: ThemePreference;
  xpTotal: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date | null;
  lastStudyLocalDate: string | null;
  totalCardsStudied: number;
  totalDecksCompleted: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Flashcard {
  id: string;
  word: string;
  translation: string;
  phonetic: string;
  example: string;
  exampleTranslation: string;
  tip: string;
}

export interface CandidateWord {
  word: string;
  translation: string;
  phonetic?: string | null;
  example?: string | null;
  exampleTranslation?: string | null;
  tip?: string | null;
  startIndex: number | null;
  endIndex: number | null;
}

export interface StudyText {
  id: string;
  themeId: ThemeId;
  targetLang: LanguageCode;
  nativeLang: LanguageCode;
  level: ProficiencyLevel;
  text: string;
  candidateWords: CandidateWord[];
  addedWords: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LanguageDeck {
  id: string;
  targetLang: LanguageCode;
  nativeLang: LanguageCode;
  totalCards: number;
  dueCount: number;
  newCount: number;
  masteredCount: number;
  lastStudiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LanguageDeckCard extends Flashcard {
  targetLang: LanguageCode;
  nativeLang: LanguageCode;
  sourceThemeId: ThemeId;
  sourceTextId: string;
  masteryLevel: MasteryLevel;
  sm2: SM2State;
  history: AnswerHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SM2State {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
}

export interface AnswerHistoryEntry {
  answer: AnswerValue;
  date: Date;
  xpEarned: number;
}

export interface WordProgress {
  id: string;
  word: string;
  targetLang: LanguageCode;
  themeId: ThemeId;
  sm2: SM2State;
  history: AnswerHistoryEntry[];
  masteryLevel: MasteryLevel;
  timesStudied: number;
  timesMastered: number;
  lastStudied: Date;
}

export interface SessionSummary {
  totalCards: number;
  knowCount: number;
  almostCount: number;
  dontCount: number;
  xpEarned: number;
  difficultCards: Flashcard[];
}

export interface SubmitCardAnswerResult {
  xpEarned: number;
  xpTotal: number;
  currentStreak: number;
  nextCardIndex: number;
  deckCompleted: boolean;
}
