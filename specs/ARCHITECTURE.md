# CardsAI — Documento de Arquitetura

> **Versão:** 1.0.0-MVP
> **Data:** 01/06/2026
> **Status:** Aprovado para desenvolvimento

---

## 1. Visão Geral do Projeto

O CardsAI é um web app de aprendizado de vocabulário em idiomas estrangeiros que combina textos curtos, flashcards e inteligência artificial. O usuário escolhe um tema de interesse (tecnologia, viagem, comida, etc.), recebe um texto contextualizado no idioma alvo, seleciona palavras diretamente no texto e adiciona essas palavras ao seu deck pessoal do idioma. O aprendizado é reforçado pelo algoritmo de repetição espaçada SM-2, garantindo memorização de longo prazo.

### 1.1 Problema

Aprender vocabulário com listas genéricas de palavras é ineficaz. Falta uma ferramenta que extraia vocabulário de contextos relevantes para o usuário e entregue isso de forma gamificada, divertida e cientificamente embasada.

### 1.2 Proposta de Valor

- Textos temáticos gerados por IA a partir de temas escolhidos pelo usuário
- Texto temático curto para descoberta ativa de vocabulário
- Deck pessoal por idioma construído pelas palavras que o usuário adiciona
- Repetição espaçada (SM-2) para memorização de longo prazo
- Experiência gamificada (XP, streaks, níveis) para manter engajamento
- Suporte a múltiplos idiomas e níveis de proficiência

---

## 2. Decisões Arquiteturais

| Decisão            | Escolha                                    | Justificativa                                               |
| ------------------ | ------------------------------------------ | ----------------------------------------------------------- |
| Frontend Framework | Next.js + (App Router)                     | Server Components, layouts aninhados, moderno               |
| Renderização       | SSG (Static Site Generation)               | Performance, compatibilidade com Firebase Hosting           |
| Hospedagem         | Firebase Hosting (tudo no Firebase)        | Simplifica infra, um ecossistema unificado                  |
| Backend            | Firebase Cloud Functions (Node.js)         | Serverless, sem gerenciar servidores, escala automática     |
| Banco de Dados     | Cloud Firestore                            | NoSQL, tempo real, integração nativa com Firebase           |
| Autenticação       | Firebase Auth                              | Google OAuth + Email/senha                                  |
| IA                 | Claude API (Anthropic) via Cloud Functions | Geração de textos e enriquecimento de palavras, chamada server-side para proteger API key |
| Estratégia de IA   | Texto + seleção ativa                      | Usuário constrói deck pessoal a partir de vocabulário encontrado em contexto |
| Repetição Espaçada | Algoritmo SM-2                             | Comprovado cientificamente, mesmo algoritmo do Anki         |
| Estilo Visual      | Gamificado (estilo Duolingo)               | Colorido, divertido, acessível                              |
| v2 (futuro)        | Backend em Go + Cloud Run + Docker         | Performance superior para orquestração de IA                |

---

## 3. Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                       │
│                                                                 │
│   Next.js + (App Router / SSG)                                │
│   ├── React Server Components (layouts, páginas estáticas)      │
│   ├── Client Components (flashcards, interações, animações)     │
│   └── Firebase SDK Client (Auth, Firestore listeners)           │
│                                                                 │
│   Deploy: Firebase Hosting (CDN global)                         │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
               │ HTTPS                    │ WebSocket (real-time)
               │                          │
┌──────────────▼──────────────────────────▼───────────────────────┐
│                      FIREBASE SERVICES                          │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │ Firebase     │  │ Cloud        │  │ Cloud Functions     │    │
│  │ Auth         │  │ Firestore    │  │ (Node.js)           │    │
│  │              │  │              │  │                     │    │
│  │ • Google     │  │ • users      │  │ • generateStudyText()│   │
│  │ • Email/pwd  │  │ • languageDecks│ │ • addWordToLanguageDeck()││
│  │              │  │ • progress   │  │ • submitCardAnswer()│    │
│  │              │  │ • studyTexts │  │ • getReviewCards()  │    │
│  └─────────────┘  └──────────────┘  └────────┬────────────┘    │
│                                               │                 │
└───────────────────────────────────────────────┼─────────────────┘
                                                │
                                                │ HTTPS (server-side)
                                                │
                                     ┌──────────▼──────────┐
                                     │   Claude API        │
                                     │   (Anthropic)       │
                                     │                     │
                                     │   Geração de textos │
                                     │   e vocabulário     │
                                     └─────────────────────┘
```

---

## 4. Modelagem de Dados (Firestore)

### 4.1 Collection: `users`

```
users/{uid}
├── displayName: string
├── email: string
├── photoURL: string | null
├── nativeLang: string              // "pt", "es", "en"
├── targetLang: string              // "en", "fr", "de"
├── level: string                   // "beginner" | "intermediate" | "advanced"
├── onboardingCompleted: boolean    // false até concluir idioma nativo/alvo e nível
├── timezone: string                // timezone IANA do usuário, ex: "America/Sao_Paulo"
├── theme: string                   // "light" | "dark"
├── xpTotal: number                 // XP acumulado total
├── currentStreak: number           // dias consecutivos estudando
├── longestStreak: number           // recorde de streak
├── lastStudyDate: timestamp        // última data de estudo
├── lastStudyLocalDate: string      // YYYY-MM-DD no timezone do usuário
├── totalCardsStudied: number       // total de cards já estudados
├── totalDecksCompleted: number     // total de decks finalizados
├── createdAt: timestamp
└── updatedAt: timestamp
```

### 4.2 Collection: `users/{uid}/languageDecks`

Cada usuário possui um deck pessoal por idioma alvo. A IA não gera esse deck automaticamente; ele é construído pelas palavras que o usuário adiciona ao selecionar vocabulário em textos temáticos.

```
users/{uid}/languageDecks/{targetLang}
├── targetLang: string              // "en"
├── nativeLang: string              // "pt"
├── totalCards: number
├── createdAt: timestamp
└── updatedAt: timestamp
```

### 4.2.1 Collection: `users/{uid}/languageDecks/{targetLang}/cards`

Cada palavra adicionada vira um card persistente do deck pessoal daquele idioma.

```
users/{uid}/languageDecks/{targetLang}/cards/{wordId}
├── word: string                    // "debugging"
├── translation: string             // "depuração"
├── phonetic: string                // "/dɪˈbʌɡ.ɪŋ/"
├── example: string                 // frase de exemplo no idioma alvo
├── exampleTranslation: string      // tradução da frase
├── tip: string                     // dica mnemônica
├── targetLang: string
├── nativeLang: string
├── sourceThemeId: string
├── sourceTextId: string
├── sm2: {
│     easeFactor: number
│     interval: number
│     repetitions: number
│     nextReview: timestamp
│   }
├── history: [
│   {
│     answer: string
│     date: timestamp
│     xpEarned: number
│   }
│ ]
├── masteryLevel: string            // "new" | "learning" | "reviewing" | "mastered"
├── timesStudied: number
├── timesMastered: number
├── createdAt: timestamp
└── lastStudied: timestamp | null
```

### 4.3 Collection: `users/{uid}/studyTexts`

Armazena textos curtos gerados por tema para que o usuário descubra vocabulário antes do deck.

```
users/{uid}/studyTexts/{textId}
├── themeId: string
├── targetLang: string
├── nativeLang: string
├── level: string
├── text: string                    // texto curto no idioma alvo
├── candidateWords: [               // palavras/expressões sugeridas para marcar
│   {
│     word: string
│     translation: string
│     phonetic: string | null
│     example: string | null
│     exampleTranslation: string | null
│     tip: string | null
│     startIndex: number | null
│     endIndex: number | null
│   }
│ ]
├── addedWords: [string]            // palavras adicionadas ao deck pelo usuário
├── createdAt: timestamp
└── updatedAt: timestamp
```

### 4.5 Índices Compostos Necessários

| Collection  | Campos                                        | Uso                              |
| ----------- | --------------------------------------------- | -------------------------------- |
| `languageDecks/{targetLang}/cards` | `sm2.nextReview` (ASC)       | Buscar cards para revisão do dia |
| `languageDecks/{targetLang}/cards` | `sourceThemeId` + `masteryLevel` | Progresso por tema             |
| `languageDecks/{targetLang}/cards` | `createdAt` (DESC)          | Cards adicionados recentemente   |
| `studyTexts`| `themeId` + `createdAt` (DESC)                | Histórico de textos por tema     |

---

## 5. Cloud Functions — API Design

### 5.1 `generateStudyText`

Responsável por gerar um texto curto de descoberta de vocabulário para um tema.

```
POST /generateStudyText
Auth: Bearer token (Firebase Auth)

Request:
{
  "themeId": "tech",
  "targetLang": "en",
  "nativeLang": "pt",
  "level": "intermediate"
}

Response:
{
  "textId": "txt123",
  "text": "Short contextual text...",
  "candidateWords": [
    {
      "word": "debugging",
      "translation": "depuração",
      "phonetic": "/dɪˈbʌɡ.ɪŋ/",
      "example": "I spent the whole afternoon debugging the payment module.",
      "exampleTranslation": "Passei a tarde toda depurando o módulo de pagamento.",
      "tip": "\"De-bug\" = tirar o bug do código."
    }
  ]
}
```

**Fluxo interno:**

```
1. Validar auth token
2. Chamar Claude API com prompt de texto curto e vocabulário candidato
3. Validar JSON de resposta
4. Salvar em users/{uid}/studyTexts
5. Retornar texto e palavras candidatas
```

### 5.2 `addWordToLanguageDeck`

Responsável por adicionar uma palavra selecionada no texto ao deck pessoal do usuário para o idioma alvo.

```
POST /addWordToLanguageDeck
Auth: Bearer token (Firebase Auth)

Request:
{
  "textId": "txt123",
  "sourceThemeId": "tech",
  "targetLang": "en",
  "nativeLang": "pt",
  "word": "debugging"
}

Response:
{
  "cardId": "en_debugging",
  "created": true,
  "card": { ... }
}
```

**Fluxo interno:**

```
1. Validar auth token
2. Validar ownership do studyText
3. Buscar word em candidateWords do texto
4. Montar wordId estável por targetLang + palavra normalizada
5. Criar users/{uid}/languageDecks/{targetLang}, se não existir
6. Se card já existe, retornar created=false
7. Se card não existe, salvar card com dados da palavra candidata e SM-2 inicial
8. Atualizar totalCards e updatedAt do deck do idioma
```

### 5.3 `createStudySession`

Responsável por montar uma sessão de até 10 cards a partir do deck pessoal do idioma.

```
POST /createStudySession
Auth: Bearer token

Request:
{
  "targetLang": "en",
  "mode": "new" | "review" | "mixed"
}

Response:
{
  "sessionId": "sess123",
  "cards": [ ... ]
}
```

**Fluxo interno:**

```
1. Buscar cards em users/{uid}/languageDecks/{targetLang}/cards
2. Priorizar cards vencidos (nextReview <= hoje no timezone do usuário)
3. Completar com cards novos se necessário
4. Retornar até 10 cards
```

### 5.4 `getReviewCards`

Retorna palavras que precisam ser revisadas hoje baseado no SM-2.

```
GET /getReviewCards
Auth: Bearer token

Response:
{
  "reviewCards": [ ... ],
  "count": 8,
  "nextReviewDate": "2026-06-02"
}
```

**Fluxo interno:**

```
1. Buscar em languageDecks/{targetLang}/cards onde nextReview <= now
2. Ordenar por nextReview ASC (mais atrasadas primeiro)
3. Limitar a 20 cards por sessão de revisão
4. Retornar com dados completos do card (word, translation, etc.)
```

### 5.5 `submitCardAnswer`

Registra a resposta de um card e centraliza os cálculos que não devem ser manipuláveis pelo client: SM-2, XP, avanço do deck e streak.

```
POST /submitCardAnswer
Auth: Bearer token

Request:
{
  "deckId": "abc123",
  "targetLang": "en",
  "cardId": "card123",
  "answer": "know" | "almost" | "dont",
  "timezone": "America/Sao_Paulo"
}

Response:
{
  "xpEarned": 15,
  "xpTotal": 1240,
  "currentStreak": 7,
  "nextCardIndex": 4,
  "deckCompleted": false
}
```

Fluxo:
1. Validar auth token e ownership do card no deck pessoal do idioma
2. Validar que o card ainda não foi respondido
3. Mapear resposta para qualidade SM-2 e XP
4. Recalcular dados SM-2 no card em languageDecks/{targetLang}/cards/{cardId}
5. Atualizar currentIndex, answeredCardIds, lastAnsweredAt e completedAt quando aplicável
6. Atualizar xpTotal
7. Atualizar streak usando o timezone IANA do usuário e persistir `lastStudyLocalDate`
8. Retornar estado atualizado para o client
```

---

## 6. Estratégia de IA — Texto + Seleção Ativa

### 6.1 Prompt Estruturado para Claude

```
Sistema: Você é um especialista em ensino de idiomas. Gere um texto curto
para descoberta ativa de vocabulário.

Contexto:
- Tema: {themeId} ({themeLabel})
- Idioma alvo: {targetLang}
- Idioma nativo do aluno: {nativeLang}
- Nível: {level}

Gere:
1. Um texto curto e natural no idioma alvo.
2. Uma lista de palavras/expressões candidatas que aparecem no texto.

Para cada palavra candidata, forneça em JSON:
- word: a palavra/expressão no idioma alvo
- translation: tradução no idioma nativo
- phonetic: transcrição fonética IPA
- example: frase de exemplo natural no idioma alvo
- exampleTranslation: tradução da frase de exemplo
- tip: dica mnemônica criativa para memorização
- startIndex/endIndex: posição aproximada no texto, se disponível

Regras:
- Priorize vocabulário de alta frequência e uso real
- O texto deve ter contexto suficiente para o usuário inferir significado
- Dicas mnemônicas devem conectar à língua nativa do aluno
- Adapte complexidade ao nível informado
- Para nível "beginner": palavras comuns, frases curtas
- Para nível "intermediate": expressões idiomáticas, phrasal verbs
- Para nível "advanced": jargão técnico, nuances, collocations

Responda APENAS com JSON: { "text": string, "candidateWords": [...] }.
```

### 6.2 Construção do Deck Pessoal

```
Texto gerado pela IA
      │
      ▼
Usuário seleciona palavra/expressão
      │
      ▼
Popup mostra tradução e ação
      │
      ▼
addWordToLanguageDeck
      │
      ▼
Card persistido no deck pessoal do idioma
      │
      ▼
Sessões estudam cards desse deck pessoal
```

### 6.3 Estimativa de Custo

| Cenário                           | Tokens (aprox.)              | Custo estimado |
| --------------------------------- | ---------------------------- | -------------- |
| 1 texto temático + candidatos     | ~1.500 input + ~2.000 output | ~$0.015        |
| Adicionar palavra candidata       | 0 se a palavra já veio enriquecida no texto | $0.00 |
| 100 usuários/dia, 2 textos/dia    | ~200 chamadas/dia            | ~$3.00/dia     |
| 1.000 usuários/dia, 2 textos/dia  | ~2.000 chamadas/dia          | ~$30.00/dia    |

---

## 7. Algoritmo SM-2 — Especificação

### 7.1 Parâmetros por Palavra

| Parâmetro     | Valor Inicial | Descrição                         |
| ------------- | ------------- | --------------------------------- |
| `easeFactor`  | 2.5           | Fator de facilidade (mínimo: 1.3) |
| `interval`    | 0             | Dias até próxima revisão          |
| `repetitions` | 0             | Repetições corretas consecutivas  |

### 7.2 Mapeamento de Respostas

| Resposta do usuário | Qualidade (q) SM-2          | XP ganho |
| ------------------- | --------------------------- | -------- |
| "Sei!" 🎯           | 5 (resposta perfeita)       | +15 XP   |
| "Quase" 🤔          | 3 (correto com dificuldade) | +8 XP    |
| "Não sei" 😕        | 1 (incorreto)               | +3 XP    |

### 7.3 Algoritmo (executado na Cloud Function `submitCardAnswer`)

```javascript
function sm2(card, quality) {
  let { easeFactor, interval, repetitions } = card.sm2;

  if (quality >= 3) {
    // Resposta correta
    if (repetitions === 0) {
      interval = 1; // primeira vez: revisa amanhã
    } else if (repetitions === 1) {
      interval = 6; // segunda vez: revisa em 6 dias
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Resposta incorreta: reseta
    repetitions = 0;
    interval = 1; // revisa amanhã
  }

  // Atualiza ease factor
  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  const nextReview = addDays(new Date(), interval);

  return { easeFactor, interval, repetitions, nextReview };
}
```

### 7.4 Níveis de Domínio

| Nível       | Condição                         | Ícone |
| ----------- | -------------------------------- | ----- |
| `new`       | Nunca estudada                   | 🆕    |
| `learning`  | repetitions < 3                  | 🌱    |
| `reviewing` | repetitions >= 3 e interval < 21 | 🌿    |
| `mastered`  | interval >= 21 dias              | 🌳    |

---

## 8. Estrutura do Projeto (Next.js)

```
cardsai/
├── src/
│   ├── app/                        # App Router
│   │   ├── layout.tsx              # Root layout (providers, fonts)
│   │   ├── page.tsx                # Login/Cadastro; redireciona sessão ativa para Estudar
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx      # Tela de login
│   │   │   └── register/page.tsx   # Tela de registro
│   │   ├── (app)/                  # Área logada (layout com sidebar/nav)
│   │   │   ├── layout.tsx          # App layout (nav, header)
│   │   │   ├── study/
│   │   │   │   ├── page.tsx        # Home logada: revisão pendente e seleção de temas
│   │   │   │   ├── text/[themeId]/page.tsx # Texto temático, popup e adicionar ao deck
│   │   │   │   └── deck/[targetLang]/page.tsx # Sessão do deck pessoal do idioma
│   │   │   ├── review/page.tsx     # Sessão de revisão (SM-2)
│   │   │   ├── progress/page.tsx   # Dashboard de progresso
│   │   │   └── settings/page.tsx   # Configurações do usuário
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # Componentes genéricos (Button, Card, Modal)
│   │   ├── flashcard/              # FlashCard, FlipAnimation, AnswerButtons
│   │   ├── gamification/           # XPBar, StreakCounter, LevelBadge, Confetti
│   │   └── layout/                 # Header, Nav, MobileNav
│   ├── lib/
│   │   ├── firebase.ts             # Firebase config e inicialização
│   │   ├── auth.ts                 # Helpers de autenticação
│   │   ├── firestore.ts            # Helpers de leitura/escrita Firestore
│   │   ├── sm2.ts                  # Implementação do algoritmo SM-2
│   │   └── constants.ts            # Temas, idiomas, níveis
│   ├── hooks/
│   │   ├── useAuth.ts              # Hook de autenticação
│   │   ├── useLanguageDeck.ts      # Hook para deck pessoal por idioma
│   │   ├── useProgress.ts          # Hook de progresso do usuário
│   │   └── useReview.ts            # Hook para sessão de revisão
│   └── types/
│       └── index.ts                # TypeScript types
├── functions/                      # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts                # Entry point (exports)
│   │   ├── generateStudyText.ts    # Texto temático e palavras candidatas
│   │   ├── addWordToLanguageDeck.ts # Adiciona palavra ao deck pessoal
│   │   ├── createStudySession.ts   # Monta sessão do deck pessoal
│   │   ├── getReviewCards.ts       # Cards para revisão (SM-2)
│   │   ├── submitCardAnswer.ts     # Resposta, SM-2, XP, streak e retomada de sessão
│   │   └── prompts/
│   │       └── studyTextGeneration.ts # Templates de prompt pro Claude
│   └── package.json
├── firebase.json                   # Config do Firebase (hosting, functions)
├── .firebaserc                     # Projeto Firebase
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 9. Segurança

### 9.1 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Usuários: só o próprio pode ler/escrever
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /studyTexts/{textId} {
        allow read: if request.auth != null && request.auth.uid == uid;
        allow write: if false; // escrita via Cloud Functions
      }

      match /languageDecks/{targetLang} {
        allow read: if request.auth != null && request.auth.uid == uid;
        allow write: if false; // escrita via Cloud Functions

        match /cards/{cardId} {
          allow read: if request.auth != null && request.auth.uid == uid;
          allow write: if false; // escrita via Cloud Functions
        }
      }
    }
  }
}
```

### 9.2 Proteção da API Key

A chave da Claude API nunca é exposta ao client. Toda chamada à IA passa pela Cloud Function `generateStudyText`, que armazena a key em variáveis de ambiente do Firebase (`firebase functions:config:set`).

### 9.3 Rate Limiting

Implementar rate limiting nas Cloud Functions para evitar abuso:

- `generateStudyText`: máximo 20 chamadas/hora por usuário
- `addWordToLanguageDeck`: máximo 120 chamadas/hora por usuário
- `getReviewCards`: máximo 30 chamadas/hora por usuário

---

## 10. Roadmap de Evolução (v2+)

| Fase | Feature            | Detalhes                                             |
| ---- | ------------------ | ---------------------------------------------------- |
| v2.0 | Backend em Go      | Microserviço Go no Cloud Run para orquestração de IA |
| v2.0 | Docker             | Containerização do backend Go                        |
| v2.1 | Input livre de texto/URL | Usuário cola texto ou URL e IA extrai vocabulário |
| v2.2 | PWA + Offline      | Service worker, estudo offline, sync ao reconectar   |
| v2.3 | Áudio/Pronúncia    | Text-to-speech para ouvir pronúncia correta          |
| v2.4 | Multiplayer        | Desafios entre amigos, rankings                      |
| v2.5 | Importar/Exportar  | Compatibilidade com formato Anki (.apkg)             |
| v3.0 | App Nativo         | React Native ou Flutter                              |

---

_Documento gerado em 01/06/2026 — CardsAI MVP Spec v1.0.0_
