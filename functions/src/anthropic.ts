import Anthropic from "@anthropic-ai/sdk";
import { logger } from "firebase-functions/v2";

/**
 * Geracao de texto tematico via Claude (Sonnet 4.6).
 *
 * O modelo recebe tema, idioma alvo, idioma nativo e nivel, e devolve um texto
 * curto no idioma alvo mais a traducao de TODAS as palavras/expressoes do texto.
 * Como o usuario pode selecionar qualquer palavra no texto, cada palavra precisa
 * ter traducao disponivel.
 *
 * Para manter a resposta compacta (e evitar truncamento de JSON / custo alto), a
 * saida e dividida em:
 *   - `glossary`: toda palavra do texto -> apenas word + translation (barato);
 *   - `studyWords`: poucas palavras-chave com campos ricos (fonetica/exemplo/dica).
 * O merge das duas listas vira `candidateWords` (toda palavra com traducao, as
 * principais enriquecidas).
 *
 * A resposta e validada como JSON e ha 1 retry em caso de erro (GEN-04). Quem
 * chama deve tratar a excecao e cair no fallback determinista (GEN-05).
 */

const MODEL = "claude-sonnet-4-6";
const MAX_ATTEMPTS = 2;
const MAX_TOKENS = 8000;

const LANGUAGE_LABELS: Record<string, string> = {
  pt: "Portuguese (Brazil)",
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "beginner (A1-A2, short and simple sentences)",
  intermediate: "intermediate (B1-B2, everyday vocabulary)",
  advanced: "advanced (C1-C2, richer vocabulary and idioms)",
};

const THEME_LABELS: Record<string, string> = {
  tech: "technology",
  travel: "travel",
  food: "food",
  business: "business",
  sports: "sports",
  movies: "movies and series",
  music: "music",
  nature: "nature",
  daily: "daily life",
};

export interface GeneratedCandidate {
  word: string;
  translation: string;
  phonetic: string | null;
  example: string | null;
  exampleTranslation: string | null;
  tip: string | null;
}

export interface GeneratedStudyText {
  text: string;
  candidateWords: GeneratedCandidate[];
}

export interface GenerateThemeTextInput {
  apiKey: string;
  themeId: string;
  targetLang: string;
  nativeLang: string;
  level: string;
}

const SYSTEM_PROMPT = [
  "You generate short reading passages for a language-learning app.",
  "Given a theme, a target language (the language being learned), a native",
  "language (used for translations), and a proficiency level, you write a",
  "compact, natural passage in the target language and then provide vocabulary",
  "data for it.",
  "",
  "Always respond with a single JSON object and nothing else — no prose, no",
  "markdown, no code fences. The JSON must have exactly this shape:",
  "{",
  '  "text": string,                       // 3-5 sentences in the TARGET language',
  '  "glossary": [                          // EVERY distinct word/expression in the text',
  "    {",
  '      "word": string,                    // a word or expression as it appears in the text',
  '      "translation": string             // its translation in the NATIVE language',
  "    }",
  "  ],",
  '  "studyWords": [                        // 6-10 of the most useful words to study',
  "    {",
  '      "word": string,                    // must also appear in glossary',
  '      "translation": string,             // translation in the NATIVE language',
  '      "phonetic": string,                // simple phonetic hint, or ""',
  '      "example": string,                 // a short example sentence in the target language',
  '      "exampleTranslation": string,      // that example translated to the native language',
  '      "tip": string                      // a short mnemonic/usage tip in the native language, or ""',
  "    }",
  "  ]",
  "}",
  "",
  "Rules:",
  "- glossary must cover EVERY meaningful word and multi-word expression in the",
  "  text (skip only bare punctuation), because the learner can tap any word and",
  "  must get a translation. Keep glossary entries tiny: only word + translation.",
  "- Group fixed expressions as one entry (e.g. \"boarding pass\").",
  "- studyWords is a small subset (6-10) with the richer fields filled in.",
  "- Every entry must have a non-empty word and translation. Translations and",
  "  tips are in the native language; the passage is in the target language.",
  "- Do not invent extra fields and do not wrap the JSON.",
].join("\n");

function buildUserPrompt(input: GenerateThemeTextInput): string {
  const theme = THEME_LABELS[input.themeId] ?? input.themeId;
  const target = LANGUAGE_LABELS[input.targetLang] ?? input.targetLang;
  const native = LANGUAGE_LABELS[input.nativeLang] ?? input.nativeLang;
  const level = LEVEL_LABELS[input.level] ?? input.level;

  return [
    `Theme: ${theme}`,
    `Target language (write the passage in this language): ${target}`,
    `Native language (write translations and tips in this language): ${native}`,
    `Learner level: ${level}`,
    "",
    "Produce the JSON object now. Remember: glossary must list every word in the",
    "text, each with its translation.",
  ].join("\n");
}

/** Remove fences acidentais e extrai o objeto JSON da resposta do modelo. */
function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Resposta do modelo nao contem JSON.");
  }

  return JSON.parse(trimmed.slice(start, end + 1));
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeKey(word: string): string {
  return word.trim().toLocaleLowerCase();
}

interface RichEntry {
  word: string;
  translation: string;
  phonetic: string | null;
  example: string | null;
  exampleTranslation: string | null;
  tip: string | null;
}

function parseStudyWords(raw: unknown): Map<string, RichEntry> {
  const map = new Map<string, RichEntry>();

  if (!Array.isArray(raw)) {
    return map;
  }

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    const word = asNonEmptyString(record.word);
    const translation = asNonEmptyString(record.translation);

    if (!word || !translation) {
      continue;
    }

    map.set(normalizeKey(word), {
      word,
      translation,
      phonetic: asNonEmptyString(record.phonetic),
      example: asNonEmptyString(record.example),
      exampleTranslation: asNonEmptyString(record.exampleTranslation),
      tip: asNonEmptyString(record.tip),
    });
  }

  return map;
}

/** Junta glossario (toda palavra) com os campos ricos das palavras-chave. */
function mergeCandidates(glossaryRaw: unknown, studyRaw: unknown): GeneratedCandidate[] {
  const rich = parseStudyWords(studyRaw);
  const candidates: GeneratedCandidate[] = [];
  const seen = new Set<string>();

  const pushEntry = (word: string, translation: string) => {
    const key = normalizeKey(word);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);

    const enriched = rich.get(key);
    candidates.push({
      word,
      translation: enriched?.translation ?? translation,
      phonetic: enriched?.phonetic ?? null,
      example: enriched?.example ?? null,
      exampleTranslation: enriched?.exampleTranslation ?? null,
      tip: enriched?.tip ?? null,
    });
  };

  if (Array.isArray(glossaryRaw)) {
    for (const item of glossaryRaw) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const record = item as Record<string, unknown>;
      const word = asNonEmptyString(record.word);
      const translation = asNonEmptyString(record.translation);

      if (word && translation) {
        pushEntry(word, translation);
      }
    }
  }

  // Garante que palavras-chave fora do glossario tambem entrem.
  for (const [key, entry] of rich) {
    if (!seen.has(key)) {
      pushEntry(entry.word, entry.translation);
    }
  }

  return candidates;
}

function parseResponse(raw: string): GeneratedStudyText {
  const parsed = extractJsonObject(raw);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("JSON do modelo nao e um objeto.");
  }

  const record = parsed as Record<string, unknown>;
  const text = asNonEmptyString(record.text);
  const candidateWords = mergeCandidates(record.glossary, record.studyWords);

  if (!text) {
    throw new Error("JSON do modelo nao trouxe texto.");
  }

  if (candidateWords.length === 0) {
    throw new Error("JSON do modelo nao trouxe palavras candidatas.");
  }

  return { text, candidateWords };
}

function extractText(response: Anthropic.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export async function generateThemeText(input: GenerateThemeTextInput): Promise<GeneratedStudyText> {
  const client = new Anthropic({ apiKey: input.apiKey });
  const userPrompt = buildUserPrompt(input);
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        thinking: { type: "disabled" },
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      if (response.stop_reason === "refusal") {
        throw new Error("Modelo recusou a geracao.");
      }

      // Resposta cortada pelo limite de tokens gera JSON invalido: falha claro.
      if (response.stop_reason === "max_tokens") {
        throw new Error("Resposta do modelo truncada (max_tokens).");
      }

      return parseResponse(extractText(response));
    } catch (error) {
      lastError = error;
      logger.warn("generateThemeText attempt failed", {
        attempt,
        themeId: input.themeId,
        targetLang: input.targetLang,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Falha ao gerar texto tematico.");
}
