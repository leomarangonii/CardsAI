# CardsAI 🃏

Aprenda vocabulário de um novo idioma com **flashcards que a IA cria pra você**.
Você escolhe um tema, o app gera um texto curto no idioma-alvo, você toca nas
palavras que quer aprender e elas viram um deck pessoal com repetição espaçada.

> App de estudo de idiomas com estética gamificada (XP, streak, níveis de
> domínio), inspirado no Duolingo.

## ✨ Principais recursos

- **Textos temáticos por IA** — gerados pela Claude (Sonnet 4.6), com tradução de
  todas as palavras do texto.
- **Deck pessoal por idioma** — você constrói seu vocabulário selecionando
  palavras diretamente no texto.
- **Repetição espaçada (SM-2)** — cada card é reagendado conforme seu desempenho;
  revisão diária dos cards vencidos.
- **Gamificação** — XP por resposta, streak diário e níveis de domínio
  (novo → aprendendo → revisando → dominado).
- **Multi-idioma** — troque o idioma de estudo a qualquer momento; o progresso de
  cada idioma é preservado.
- **Modo escuro** e layout mobile-first.

## 🧱 Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript |
| Backend | Firebase Cloud Functions v2 (Node 22), Firestore |
| Auth | Firebase Auth (Google + e-mail/senha) |
| IA | Claude API (`@anthropic-ai/sdk`, modelo `claude-sonnet-4-6`) |
| Hosting | Firebase App Hosting |

## 🚀 Rodando localmente

O projeto usa **pnpm via Corepack**.

```bash
# instalar dependências
corepack pnpm install

# variáveis de ambiente (config pública do Firebase web)
cp .env.example .env.local   # e preencha os valores

# subir o app
corepack pnpm dev            # http://localhost:3000
```

Comandos úteis:

```bash
corepack pnpm lint                    # ESLint
corepack pnpm build                   # build de produção
corepack pnpm --dir functions build   # build das Cloud Functions
```

## 🔐 Configuração de segredos

- As chaves `NEXT_PUBLIC_FIREBASE_*` são **públicas** (config web do Firebase) e
  ficam em `.env.local` / `apphosting.yaml`.
- A **chave da Claude API** é um segredo do Firebase (`ANTHROPIC_API_KEY`,
  via Secret Manager) e é usada **apenas no servidor** (Cloud Functions) — nunca
  é exposta ao client.

## 📁 Estrutura

```
src/app         → rotas (App Router): login, onboarding, estudar, progresso, config
src/components  → UI (auth, flashcard, study, layout, settings, mascote…)
src/lib         → domínio: SM-2, XP, datas, wrappers do Firebase
functions/src   → Cloud Functions (geração de texto, deck, sessão, SM-2, conta)
specs           → REQUIREMENTS.md e ARCHITECTURE.md do MVP
```

## ☁️ Deploy

- **App (SSR):** Firebase App Hosting, buildado a partir deste repositório.
- **Backend:** `corepack pnpm firebase deploy --only functions`
- **Regras/índices:** `corepack pnpm firebase deploy --only firestore`

---

Projeto pessoal em desenvolvimento — MVP.
