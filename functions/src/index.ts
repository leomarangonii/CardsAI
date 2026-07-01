import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  FieldValue,
  Timestamp,
  getFirestore,
  type DocumentData,
  type DocumentReference,
} from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { logger, setGlobalOptions } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import { generateThemeText, type GeneratedCandidate } from "./anthropic";

const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

initializeApp();
setGlobalOptions({ region: "southamerica-east1", maxInstances: 10, invoker: "public" });

const db = getFirestore();

const LANGUAGE_CODES = ["pt", "en", "es", "fr", "de", "it"] as const;
const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const THEMES = [
  "tech",
  "travel",
  "food",
  "business",
  "sports",
  "movies",
  "music",
  "nature",
  "daily",
] as const;
const ANSWERS = ["know", "almost", "dont"] as const;
const MAX_SESSION_CARDS = 10;
const MAX_REVIEW_CARDS = 20;
// Palavra vira "mastered" quando o SM-2 espaça a revisão para >= 21 dias (GAM-04).
const MASTERED_INTERVAL_DAYS = 21;
const callableOptions = {
  invoker: "public",
  cors: [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
    "https://cardsai-dev.web.app",
    "https://cardsai-dev.firebaseapp.com",
    "https://cards-ai-dev--cardsai-dev.us-east4.hosted.app",
  ],
};

type LanguageCode = (typeof LANGUAGE_CODES)[number];
type ThemeId = (typeof THEMES)[number];
type AnswerValue = (typeof ANSWERS)[number];
type MasteryLevel = "new" | "learning" | "reviewing" | "mastered";

interface CandidateWord {
  word: string;
  translation: string;
  phonetic: string | null;
  example: string | null;
  exampleTranslation: string | null;
  tip: string | null;
  startIndex: number | null;
  endIndex: number | null;
}

interface Flashcard {
  id: string;
  word: string;
  translation: string;
  phonetic: string;
  example: string;
  exampleTranslation: string;
  tip: string;
}

interface SM2State {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Timestamp;
}

const THEME_TEXTS: Record<ThemeId, { text: string; candidateWords: CandidateWord[] }> = {
  tech: {
    text:
      "During a busy product sprint, Lucas had to debug a payment module before the deploy. The team checked the database logs, fixed an authentication bug, and shipped a small update without breaking the user experience.",
    candidateWords: [
      buildCandidate("sprint", "ciclo curto de trabalho"),
      buildCandidate("debug", "depurar"),
      buildCandidate("deploy", "publicar"),
      buildCandidate("database", "banco de dados"),
      buildCandidate("authentication", "autenticacao"),
      buildCandidate("shipped", "lancou / entregou"),
    ],
  },
  travel: {
    text:
      "At the airport, Ana checked her boarding pass, asked about the gate, and confirmed her luggage allowance before the flight.",
    candidateWords: [
      buildCandidate("boarding pass", "cartao de embarque"),
      buildCandidate("gate", "portao"),
      buildCandidate("luggage allowance", "franquia de bagagem"),
    ],
  },
  food: {
    text:
      "At the restaurant, Lucas asked for the receipt, checked the ingredients, and ordered a side dish because the main course was too spicy.",
    candidateWords: [
      buildCandidate("receipt", "recibo"),
      buildCandidate("ingredients", "ingredientes"),
      buildCandidate("side dish", "acompanhamento"),
      buildCandidate("spicy", "apimentado"),
    ],
  },
  business: {
    text:
      "During the meeting, the team reviewed the budget, aligned the deadline, and prepared a clear proposal for the client.",
    candidateWords: [
      buildCandidate("budget", "orcamento"),
      buildCandidate("deadline", "prazo"),
      buildCandidate("proposal", "proposta"),
      buildCandidate("client", "cliente"),
    ],
  },
  sports: {
    text:
      "Before the match, the coach explained the strategy and reminded everyone to keep possession under pressure.",
    candidateWords: [
      buildCandidate("coach", "treinador"),
      buildCandidate("strategy", "estrategia"),
      buildCandidate("possession", "posse"),
      buildCandidate("pressure", "pressao"),
    ],
  },
  movies: {
    text:
      "The series finale had a surprising plot twist, strong performances, and a soundtrack that made the final scene unforgettable.",
    candidateWords: [
      buildCandidate("finale", "episodio final"),
      buildCandidate("plot twist", "reviravolta"),
      buildCandidate("performance", "atuacao"),
      buildCandidate("soundtrack", "trilha sonora"),
    ],
  },
  music: {
    text:
      "At the concert, the singer changed the arrangement, the crowd followed the rhythm, and the band played an encore.",
    candidateWords: [
      buildCandidate("arrangement", "arranjo"),
      buildCandidate("crowd", "multidao"),
      buildCandidate("rhythm", "ritmo"),
      buildCandidate("encore", "bis"),
    ],
  },
  nature: {
    text: "The trail crossed a dense forest, followed a riverbank, and reached a viewpoint before sunset.",
    candidateWords: [
      buildCandidate("trail", "trilha"),
      buildCandidate("riverbank", "margem do rio"),
      buildCandidate("viewpoint", "mirante"),
      buildCandidate("sunset", "por do sol"),
    ],
  },
  daily: {
    text:
      "In the morning, Lucas checked his schedule, ran a few errands, and cleaned up his desk before starting work.",
    candidateWords: [
      buildCandidate("schedule", "agenda"),
      buildCandidate("errands", "tarefas na rua"),
      buildCandidate("cleaned up", "arrumou"),
      buildCandidate("desk", "mesa de trabalho"),
    ],
  },
};

export const generateStudyText = onCall(
  { ...callableOptions, secrets: [ANTHROPIC_API_KEY] },
  async (request) => {
    const uid = requireUid(request.auth?.uid);
    const data = asRecord(request.data);
    const themeId = enumField(data, "themeId", THEMES);
    const targetLang = enumField(data, "targetLang", LANGUAGE_CODES);
    const nativeLang = enumField(data, "nativeLang", LANGUAGE_CODES);
    const level = enumField(data, "level", LEVELS);
    const now = Timestamp.now();

    const { text, candidateWords, generationSource } = await resolveStudyText({
      themeId,
      targetLang,
      nativeLang,
      level,
    });

    const docRef = db.collection("users").doc(uid).collection("studyTexts").doc();
    await docRef.set({
      themeId,
      targetLang,
      nativeLang,
      level,
      text,
      candidateWords,
      addedWords: [],
      createdAt: now,
      updatedAt: now,
      generationSource,
    });

    return {
      textId: docRef.id,
      text,
      candidateWords,
    };
  },
);

/**
 * Gera o texto tematico via Claude e cai no texto determinista quando a IA
 * falha ou a chave nao esta configurada (GEN-05).
 */
async function resolveStudyText(input: {
  themeId: ThemeId;
  targetLang: LanguageCode;
  nativeLang: LanguageCode;
  level: (typeof LEVELS)[number];
}): Promise<{ text: string; candidateWords: CandidateWord[]; generationSource: string }> {
  const apiKey = readAnthropicKey();

  if (apiKey) {
    try {
      const generated = await generateThemeText({ apiKey, ...input });
      return {
        text: generated.text,
        candidateWords: generated.candidateWords.map(toCandidateWord),
        generationSource: "claude-sonnet-4-6",
      };
    } catch (error) {
      logger.error("generateStudyText: falha na IA, usando fallback", {
        themeId: input.themeId,
        targetLang: input.targetLang,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const fallback = THEME_TEXTS[input.themeId];
  return {
    text: fallback.text,
    candidateWords: fallback.candidateWords,
    generationSource: apiKey ? "stub-fallback" : "stub",
  };
}

function readAnthropicKey(): string | null {
  try {
    const value = ANTHROPIC_API_KEY.value();
    return value && value.trim().length > 0 ? value : null;
  } catch {
    return null;
  }
}

function toCandidateWord(candidate: GeneratedCandidate): CandidateWord {
  return {
    word: candidate.word,
    translation: candidate.translation,
    phonetic: candidate.phonetic,
    example: candidate.example,
    exampleTranslation: candidate.exampleTranslation,
    tip: candidate.tip,
    startIndex: null,
    endIndex: null,
  };
}

export const addWordToLanguageDeck = onCall(callableOptions, async (request) => {
  const uid = requireUid(request.auth?.uid);
  const data = asRecord(request.data);
  const textId = stringField(data, "textId");
  const sourceThemeId = enumField(data, "sourceThemeId", THEMES);
  const targetLang = enumField(data, "targetLang", LANGUAGE_CODES);
  const nativeLang = enumField(data, "nativeLang", LANGUAGE_CODES);
  const word = stringField(data, "word", 80);
  const fallbackTranslation = optionalStringField(data, "translation", 160);
  const now = Timestamp.now();
  const textRef = userStudyTextRef(uid, textId);
  const deckRef = userLanguageDeckRef(uid, targetLang);
  const cardId = buildWordId({ word, targetLang });
  const cardRef = deckRef.collection("cards").doc(cardId);

  return db.runTransaction(async (transaction) => {
    const textSnap = await transaction.get(textRef);

    if (!textSnap.exists) {
      throw new HttpsError("not-found", "Texto de estudo nao encontrado.");
    }

    const studyText = textSnap.data() ?? {};
    assertTextOwnership(studyText, sourceThemeId, targetLang, nativeLang);

    const candidate = findCandidate(word, studyText.candidateWords);
    const cardPayload = buildCardPayload({
      candidate,
      word,
      fallbackTranslation,
      sourceThemeId,
      sourceTextId: textId,
      targetLang,
      nativeLang,
      now,
    });

    const cardSnap = await transaction.get(cardRef);

    transaction.set(
      deckRef,
      {
        targetLang,
        nativeLang,
        totalCards: FieldValue.increment(cardSnap.exists ? 0 : 1),
        createdAt: cardSnap.exists ? FieldValue.serverTimestamp() : now,
        updatedAt: now,
      },
      { merge: true },
    );

    transaction.set(
      textRef,
      {
        addedWords: FieldValue.arrayUnion(cardPayload.word),
        updatedAt: now,
      },
      { merge: true },
    );

    if (!cardSnap.exists) {
      transaction.set(cardRef, cardPayload);
    }

    return {
      cardId,
      created: !cardSnap.exists,
      card: serializeCard(cardId, cardSnap.exists ? cardSnap.data() : cardPayload),
    };
  });
});

export const createStudySession = onCall(callableOptions, async (request) => {
  const uid = requireUid(request.auth?.uid);
  const data = asRecord(request.data);
  const targetLang = enumField(data, "targetLang", LANGUAGE_CODES);
  const mode = enumField(data, "mode", ["new", "review", "mixed"] as const);
  const limit = clampLimit(optionalNumberField(data, "limit") ?? MAX_SESSION_CARDS, MAX_SESSION_CARDS);
  const cardsRef = userLanguageDeckRef(uid, targetLang).collection("cards");
  const cards = await loadSessionCards(cardsRef, mode, limit);

  return {
    sessionId: `sess_${Date.now()}`,
    cards: cards.map(({ id, data: card }) => serializeCard(id, card)),
  };
});

export const getReviewCards = onCall(callableOptions, async (request) => {
  const uid = requireUid(request.auth?.uid);
  const data = asRecord(request.data);
  const targetLang = enumField(data, "targetLang", LANGUAGE_CODES);
  const limit = clampLimit(optionalNumberField(data, "limit") ?? MAX_REVIEW_CARDS, MAX_REVIEW_CARDS);
  const now = Timestamp.now();
  const snapshot = await userLanguageDeckRef(uid, targetLang)
    .collection("cards")
    .where("sm2.nextReview", "<=", now)
    .orderBy("sm2.nextReview", "asc")
    .limit(limit)
    .get();
  const reviewCards = snapshot.docs.map((doc) => serializeCard(doc.id, doc.data()));
  const nextReviewDate = reviewCards.length > 0 ? null : await getNextReviewDate(uid, targetLang);

  return {
    reviewCards,
    count: reviewCards.length,
    nextReviewDate,
  };
});

export const submitCardAnswer = onCall(callableOptions, async (request) => {
  const uid = requireUid(request.auth?.uid);
  const data = asRecord(request.data);
  const targetLang = enumField(data, "targetLang", LANGUAGE_CODES);
  const cardId = stringField(data, "cardId", 120);
  const answer = enumField(data, "answer", ANSWERS);
  const timezone = stringField(data, "timezone", 80);
  const now = Timestamp.now();
  const userRef = db.collection("users").doc(uid);
  const deckRef = userLanguageDeckRef(uid, targetLang);
  const cardRef = deckRef.collection("cards").doc(cardId);
  const answerConfig = getAnswerConfig(answer);

  return db.runTransaction(async (transaction) => {
    const [userSnap, cardSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(cardRef),
    ]);

    if (!cardSnap.exists) {
      throw new HttpsError("not-found", "Card nao encontrado.");
    }

    const user = userSnap.data() ?? {};
    const card = cardSnap.data() ?? {};
    const currentSm2 = parseSm2(card.sm2);
    const nextSm2 = calculateSM2(currentSm2, answerConfig.quality, now.toDate());
    const nextMasteryLevel = getMasteryLevel(nextSm2);
    const currentXp = numberValue(user.xpTotal, 0);
    const currentStreak = numberValue(user.currentStreak, 0);
    const longestStreak = numberValue(user.longestStreak, 0);
    const lastStudyLocalDate = typeof user.lastStudyLocalDate === "string" ? user.lastStudyLocalDate : null;
    const todayKey = getLocalDateKey(now.toDate(), timezone);
    const nextStreak = getNextStreak(currentStreak, lastStudyLocalDate, todayKey);
    const nextXpTotal = currentXp + answerConfig.xp;

    transaction.set(
      userRef,
      {
        xpTotal: nextXpTotal,
        currentStreak: nextStreak,
        longestStreak: Math.max(longestStreak, nextStreak),
        lastStudyDate: now,
        lastStudyLocalDate: todayKey,
        timezone,
        totalCardsStudied: FieldValue.increment(1),
        updatedAt: now,
      },
      { merge: true },
    );

    transaction.set(
      cardRef,
      {
        sm2: nextSm2,
        masteryLevel: nextMasteryLevel,
        timesStudied: FieldValue.increment(1),
        timesMastered: FieldValue.increment(answer === "know" ? 1 : 0),
        lastStudied: now,
        updatedAt: now,
        history: FieldValue.arrayUnion({
          answer,
          date: now,
          xpEarned: answerConfig.xp,
        }),
      },
      { merge: true },
    );

    transaction.set(deckRef, { updatedAt: now, lastStudiedAt: now }, { merge: true });

    return {
      xpEarned: answerConfig.xp,
      xpTotal: nextXpTotal,
      currentStreak: nextStreak,
      nextCardIndex: numberValue(user.totalCardsStudied, 0) + 1,
      deckCompleted: false,
    };
  });
});

export const deleteAccount = onCall(callableOptions, async (request) => {
  const uid = requireUid(request.auth?.uid);
  const userRef = db.collection("users").doc(uid);

  // Apaga o documento do usuario e todas as subcolecoes (languageDecks/cards, studyTexts).
  await db.recursiveDelete(userRef);

  // Remove a identidade do Firebase Auth (admin nao exige reautenticacao recente).
  await getAuth().deleteUser(uid);

  return { deleted: true };
});

function requireUid(uid: string | undefined): string {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Usuario precisa estar autenticado.");
  }

  return uid;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpsError("invalid-argument", "Payload invalido.");
  }

  return value as Record<string, unknown>;
}

function stringField(data: Record<string, unknown>, field: string, maxLength = 120): string {
  const value = data[field];

  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `Campo ${field} e obrigatorio.`);
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.length > maxLength) {
    throw new HttpsError("invalid-argument", `Campo ${field} tem tamanho invalido.`);
  }

  return trimmed;
}

function optionalStringField(
  data: Record<string, unknown>,
  field: string,
  maxLength = 120,
): string | null {
  const value = data[field];

  if (value == null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `Campo ${field} precisa ser texto.`);
  }

  return value.trim().slice(0, maxLength);
}

function optionalNumberField(data: Record<string, unknown>, field: string): number | null {
  const value = data[field];

  if (value == null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new HttpsError("invalid-argument", `Campo ${field} precisa ser numero.`);
  }

  return value;
}

function enumField<const T extends readonly string[]>(
  data: Record<string, unknown>,
  field: string,
  allowed: T,
): T[number] {
  const value = stringField(data, field);

  if (!(allowed as readonly string[]).includes(value)) {
    throw new HttpsError("invalid-argument", `Campo ${field} possui valor invalido.`);
  }

  return value;
}

function userStudyTextRef(uid: string, textId: string): DocumentReference<DocumentData> {
  return db.collection("users").doc(uid).collection("studyTexts").doc(textId);
}

function userLanguageDeckRef(uid: string, targetLang: LanguageCode): DocumentReference<DocumentData> {
  return db.collection("users").doc(uid).collection("languageDecks").doc(targetLang);
}

function buildCandidate(word: string, translation: string): CandidateWord {
  return {
    word,
    translation,
    phonetic: null,
    example: null,
    exampleTranslation: null,
    tip: null,
    startIndex: null,
    endIndex: null,
  };
}

function normalizeWord(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildWordId({ word, targetLang }: { word: string; targetLang: LanguageCode }): string {
  const slug = normalizeWord(word).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  return `${targetLang}_${slug || "word"}`;
}

function findCandidate(word: string, rawCandidates: unknown): CandidateWord | null {
  if (!Array.isArray(rawCandidates)) {
    return null;
  }

  const normalizedWord = normalizeWord(word);
  const candidates = rawCandidates.filter(isCandidateWord);

  return (
    candidates.find((candidate) => normalizeWord(candidate.word) === normalizedWord) ??
    candidates.find((candidate) => normalizeWord(candidate.word).includes(normalizedWord)) ??
    null
  );
}

function isCandidateWord(value: unknown): value is CandidateWord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.word === "string" && typeof candidate.translation === "string";
}

function assertTextOwnership(
  studyText: DocumentData,
  sourceThemeId: ThemeId,
  targetLang: LanguageCode,
  nativeLang: LanguageCode,
) {
  if (
    studyText.themeId === sourceThemeId &&
    studyText.targetLang === targetLang &&
    studyText.nativeLang === nativeLang
  ) {
    return;
  }

  throw new HttpsError("permission-denied", "Texto nao pertence ao contexto informado.");
}

function buildCardPayload({
  candidate,
  word,
  fallbackTranslation,
  sourceThemeId,
  sourceTextId,
  targetLang,
  nativeLang,
  now,
}: {
  candidate: CandidateWord | null;
  word: string;
  fallbackTranslation: string | null;
  sourceThemeId: ThemeId;
  sourceTextId: string;
  targetLang: LanguageCode;
  nativeLang: LanguageCode;
  now: Timestamp;
}) {
  const finalWord = candidate?.word ?? word;
  const translation = candidate?.translation ?? fallbackTranslation ?? "Traducao pendente";

  return {
    word: finalWord,
    normalizedWord: normalizeWord(finalWord),
    translation,
    phonetic: candidate?.phonetic ?? "",
    example: candidate?.example ?? `Use "${finalWord}" in a real sentence.`,
    exampleTranslation: candidate?.exampleTranslation ?? `Use "${translation}" em uma frase real.`,
    tip: candidate?.tip ?? "Revise esta palavra em contexto para fixar melhor.",
    targetLang,
    nativeLang,
    sourceThemeId,
    sourceTextId,
    sm2: {
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: now,
    },
    history: [],
    masteryLevel: "new" satisfies MasteryLevel,
    timesStudied: 0,
    timesMastered: 0,
    createdAt: now,
    updatedAt: now,
    lastStudied: null,
  };
}

function serializeCard(id: string, data: DocumentData | undefined): Flashcard {
  const card = data ?? {};

  return {
    id,
    word: stringValue(card.word),
    translation: stringValue(card.translation),
    phonetic: stringValue(card.phonetic),
    example: stringValue(card.example),
    exampleTranslation: stringValue(card.exampleTranslation),
    tip: stringValue(card.tip),
  };
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

async function loadSessionCards(
  cardsRef: FirebaseFirestore.CollectionReference<DocumentData>,
  mode: "new" | "review" | "mixed",
  limit: number,
) {
  const now = Timestamp.now();
  const dueSnapshot = await cardsRef
    .where("sm2.nextReview", "<=", now)
    .orderBy("sm2.nextReview", "asc")
    .limit(limit)
    .get();

  if (mode !== "new") {
    return dueSnapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  }

  const newSnapshot = await cardsRef
    .where("masteryLevel", "==", "new")
    .orderBy("createdAt", "asc")
    .limit(limit)
    .get();

  return newSnapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
}

function clampLimit(value: number, max: number): number {
  return Math.max(1, Math.min(Math.floor(value), max));
}

async function getNextReviewDate(uid: string, targetLang: LanguageCode): Promise<string | null> {
  const snapshot = await userLanguageDeckRef(uid, targetLang)
    .collection("cards")
    .orderBy("sm2.nextReview", "asc")
    .limit(1)
    .get();

  const nextReview = snapshot.docs[0]?.data().sm2?.nextReview;

  if (nextReview instanceof Timestamp) {
    return nextReview.toDate().toISOString();
  }

  return null;
}

function getAnswerConfig(answer: AnswerValue): { xp: number; quality: 1 | 3 | 5 } {
  if (answer === "know") {
    return { xp: 15, quality: 5 };
  }

  if (answer === "almost") {
    return { xp: 8, quality: 3 };
  }

  return { xp: 3, quality: 1 };
}

function parseSm2(value: unknown): Pick<SM2State, "easeFactor" | "interval" | "repetitions"> {
  if (!value || typeof value !== "object") {
    return { easeFactor: 2.5, interval: 0, repetitions: 0 };
  }

  const sm2 = value as Record<string, unknown>;

  return {
    easeFactor: numberValue(sm2.easeFactor, 2.5),
    interval: numberValue(sm2.interval, 0),
    repetitions: numberValue(sm2.repetitions, 0),
  };
}

function calculateSM2(
  currentState: Pick<SM2State, "easeFactor" | "interval" | "repetitions">,
  quality: 1 | 3 | 5,
  studiedAt: Date,
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

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(1.3, Number(easeFactor.toFixed(2)));

  const nextReview = new Date(studiedAt);
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview: Timestamp.fromDate(nextReview),
  };
}

/**
 * Nível de domínio a partir do estado SM-2 (GAM-04). Alinhado ao spec:
 *  - learning: ainda em fixação (repetições < 3, inclui cards que acabaram de falhar);
 *  - reviewing: graduado (repetições >= 3) mas intervalo ainda < 21 dias;
 *  - mastered: graduado e intervalo >= 21 dias.
 * "new" só vale para o card recém-criado (definido em buildCardPayload).
 */
function getMasteryLevel(sm2: Pick<SM2State, "interval" | "repetitions">): MasteryLevel {
  if (sm2.repetitions >= 3) {
    return sm2.interval >= MASTERED_INTERVAL_DAYS ? "mastered" : "reviewing";
  }

  return "learning";
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getLocalDateKey(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new HttpsError("invalid-argument", "Timezone invalido.");
  }

  return `${year}-${month}-${day}`;
}

function getNextStreak(
  currentStreak: number,
  lastStudyLocalDate: string | null,
  todayKey: string,
): number {
  if (lastStudyLocalDate === todayKey) {
    return currentStreak;
  }

  if (lastStudyLocalDate && diffDateKeys(todayKey, lastStudyLocalDate) === 1) {
    return currentStreak + 1;
  }

  return 1;
}

function diffDateKeys(laterDateKey: string, earlierDateKey: string): number {
  const later = Date.parse(`${laterDateKey}T00:00:00Z`);
  const earlier = Date.parse(`${earlierDateKey}T00:00:00Z`);

  if (Number.isNaN(later) || Number.isNaN(earlier)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.round((later - earlier) / 86_400_000);
}
