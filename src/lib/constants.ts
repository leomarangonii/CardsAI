import type {
  AnswerValue,
  LanguageOption,
  LevelOption,
  ThemeOption,
} from "@/types";

export const DECK_SIZE = 10;
export const MAX_REVIEW_CARDS = 20;
export const DECK_CACHE_TTL_DAYS = 30;

export const LANGUAGES: LanguageOption[] = [
  { code: "pt", label: "Português", nativeLabel: "Português", shortLabel: "BR" },
  { code: "en", label: "English", nativeLabel: "English", shortLabel: "US" },
  { code: "es", label: "Español", nativeLabel: "Español", shortLabel: "ES" },
  { code: "fr", label: "Français", nativeLabel: "Français", shortLabel: "FR" },
  { code: "de", label: "Deutsch", nativeLabel: "Deutsch", shortLabel: "DE" },
  { code: "it", label: "Italiano", nativeLabel: "Italiano", shortLabel: "IT" },
];

export const LEVELS: LevelOption[] = [
  {
    id: "beginner",
    icon: "🌱",
    label: "Iniciante",
    description: "Vocabulário comum e frases curtas.",
  },
  {
    id: "intermediate",
    icon: "🌿",
    label: "Intermediário",
    description: "Expressões do dia a dia e contexto real.",
  },
  {
    id: "advanced",
    icon: "🌳",
    label: "Avançado",
    description: "Nuances, collocations e vocabulário específico.",
  },
];

export const THEMES: ThemeOption[] = [
  {
    id: "tech",
    emoji: "💻",
    label: "Tecnologia",
    description: "Vocabulário técnico, produto e desenvolvimento.",
  },
  {
    id: "travel",
    emoji: "✈️",
    label: "Viagem",
    description: "Aeroporto, hospedagem, direção e turismo.",
  },
  {
    id: "food",
    emoji: "🍕",
    label: "Comida",
    description: "Restaurantes, ingredientes e pedidos.",
  },
  {
    id: "business",
    emoji: "💼",
    label: "Negócios",
    description: "Reuniões, trabalho, marketing e vendas.",
  },
  {
    id: "sports",
    emoji: "⚽",
    label: "Esportes",
    description: "Jogos, treinos, regras e competições.",
  },
  {
    id: "movies",
    emoji: "🎬",
    label: "Filmes & Séries",
    description: "Histórias, gêneros, cenas e críticas.",
  },
  {
    id: "music",
    emoji: "🎵",
    label: "Música",
    description: "Instrumentos, shows, letras e estilos.",
  },
  {
    id: "nature",
    emoji: "🌿",
    label: "Natureza",
    description: "Ambiente, animais, clima e paisagens.",
  },
  {
    id: "daily",
    emoji: "☀️",
    label: "Dia a dia",
    description: "Rotina, casa, tarefas e conversas comuns.",
  },
];

export const ANSWER_CONFIG: Record<
  AnswerValue,
  { label: string; emoji: string; xp: number; quality: 1 | 3 | 5 }
> = {
  dont: { label: "Não sei", emoji: "😕", xp: 3, quality: 1 },
  almost: { label: "Quase", emoji: "🤔", xp: 8, quality: 3 },
  know: { label: "Sei!", emoji: "🎯", xp: 15, quality: 5 },
};

export const MASTERY_INTERVAL_DAYS = {
  reviewing: 21,
} as const;
