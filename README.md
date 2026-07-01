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


