# CardsAI — Requisitos Funcionais (MVP)

> **Versão:** 1.0.0-MVP
> **Data:** 01/06/2026
> **Status:** Aprovado para desenvolvimento
> **Referência:** [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 1. Escopo do MVP

O MVP contempla o fluxo completo de aprendizado por flashcards: cadastro, seleção de tema, geração de texto temático via IA, seleção de palavras pelo usuário, deck pessoal por idioma, estudo com flip de cards, feedback por card, repetição espaçada e acompanhamento de progresso. O design segue uma estética gamificada inspirada no Duolingo (colorido, divertido, com elementos de XP e streak).

### 1.1 O que ESTÁ no MVP

- Autenticação (Google + Email/senha)
- Onboarding (idioma nativo, idioma alvo, nível)
- Seleção de temas para estudo
- Leitura de texto curto sobre o tema com marcação de palavras novas
- Geração de textos temáticos via Claude API
- Deck pessoal por idioma construído a partir de palavras selecionadas pelo usuário
- Flashcard interativo com animação de flip
- Sistema de feedback (Sei / Quase / Não sei)
- Algoritmo SM-2 para repetição espaçada
- Sessão de revisão diária
- Gamificação: XP, streak diário, níveis de domínio
- Tela Estudar como home logada, com revisão pendente e temas
- Dashboard de progresso
- Modo escuro
- Responsividade mobile-first

### 1.2 O que NÃO está no MVP

- Input livre de texto/URL pelo usuário
- Áudio e pronúncia (text-to-speech)
- Modo offline / PWA
- Multiplayer ou desafios sociais
- Importação/exportação de decks
- App nativo (mobile)
- Painel administrativo
- Planos pagos / monetização

---

## 2. Personas

### 2.1 Persona Primária — "Lucas"

- 26 anos, desenvolvedor, aprendendo inglês
- Consome conteúdo técnico em inglês diariamente
- Vocabulário limitado para conversação e leitura fluida
- Quer aprender de forma rápida nos intervalos do dia (5-10 min por sessão)
- Motivado por gamificação e progresso visível

### 2.2 Persona Secundária — "Ana"

- 32 anos, profissional de marketing, aprendendo espanhol
- Interesse em vocabulário de negócios e viagem
- Prefere aprendizado contextualizado com exemplos reais
- Usa principalmente o celular

---

## 3. Requisitos Funcionais

### 3.1 Módulo: Autenticação

| ID | Requisito | Prioridade | Critério de Aceitação |
|----|-----------|------------|----------------------|
| AUTH-01 | Cadastro com email e senha | Alta | Usuário cria conta com email válido, senha mínima de 6 caracteres. Recebe confirmação visual de sucesso. |
| AUTH-02 | Login com email e senha | Alta | Usuário acessa a conta com credenciais válidas. Erro claro para credenciais inválidas. |
| AUTH-03 | Login com Google (OAuth) | Alta | Botão "Entrar com Google" redireciona para fluxo OAuth, cria conta automaticamente se primeiro acesso. |
| AUTH-04 | Logout | Alta | Botão de logout limpa sessão, redireciona para tela de login. |
| AUTH-05 | Persistência de sessão | Alta | Sessão mantida ao fechar e reabrir o navegador (Firebase persistence). |
| AUTH-06 | Redirecionamento de rotas protegidas | Alta | Usuário não autenticado é redirecionado para login ao acessar áreas protegidas. |
| AUTH-07 | Recuperação de senha | Média | Usuário solicita reset de senha por email via Firebase Auth. |

---

### 3.2 Módulo: Onboarding

| ID | Requisito | Prioridade | Critério de Aceitação |
|----|-----------|------------|----------------------|
| ONB-01 | Seleção de idioma nativo | Alta | Usuário escolhe entre: Português, English, Español, Français, Deutsch, Italiano. Default: Português. |
| ONB-02 | Seleção de idioma alvo | Alta | Lista de idiomas disponíveis exclui o idioma nativo selecionado. |
| ONB-03 | Seleção de nível | Alta | 3 opções: Iniciante (🌱), Intermediário (🌿), Avançado (🌳). Cada uma com descrição breve. |
| ONB-04 | Persistência das escolhas | Alta | Configurações salvas no Firestore em `users/{uid}`. |
| ONB-05 | Edição posterior | Média | Usuário pode alterar idioma e nível nas configurações a qualquer momento. |
| ONB-06 | Onboarding condicional | Alta | Onboarding exibido apenas no primeiro acesso. Acessos posteriores vão direto ao dashboard. |

---

### 3.3 Módulo: Seleção de Temas

| ID | Requisito | Prioridade | Critério de Aceitação |
|----|-----------|------------|----------------------|
| THM-01 | Grid de temas | Alta | Exibir grid com os temas disponíveis. Cada tema com emoji e label. Mínimo 9 temas no MVP. |
| THM-02 | Temas disponíveis | Alta | Tecnologia 💻, Viagem ✈️, Comida 🍕, Negócios 💼, Esportes ⚽, Filmes & Séries 🎬, Música 🎵, Natureza 🌿, Dia a dia ☀️. |
| THM-03 | Feedback visual de seleção | Alta | Ao tocar no tema, loading visual enquanto o texto temático é gerado. |
| THM-04 | Indicador de progresso por tema | Baixa | Badge ou barra mostrando quantas palavras o usuário já domina naquele tema. |

---

### 3.4 Módulo: Geração de Texto (IA)

| ID | Requisito | Prioridade | Critério de Aceitação |
|----|-----------|------------|----------------------|
| GEN-01 | Geração via Cloud Function | Alta | Client chama Cloud Function `generateStudyText` com themeId, targetLang, nativeLang e level. |
| GEN-02 | Texto contextualizado | Alta | Function chama Claude API e retorna texto curto no idioma alvo, compatível com tema e nível. |
| GEN-03 | Palavras candidatas | Alta | Resposta inclui lista de palavras/expressões candidatas com tradução, exemplo e metadados suficientes para adicionar ao deck. |
| GEN-04 | Validação da resposta da IA | Alta | Validar que a resposta é JSON válido, com text e candidateWords. Retry 1x em caso de erro. |
| GEN-05 | Fallback de erro | Alta | Se a geração falhar, exibir mensagem amigável e sugerir tentar novamente. |
| GEN-06 | Sem geração automática de deck | Alta | IA não cria deck completo automaticamente; o deck pessoal é construído pelas palavras que o usuário adiciona. |

---

### 3.4.1 Módulo: Texto Temático

| ID | Requisito | Prioridade | Critério de Aceitação |
|----|-----------|------------|----------------------|
| TXT-01 | Texto curto por tema | Alta | Após escolher um tema, o usuário recebe um texto curto e contextualizado no idioma alvo, compatível com seu nível. |
| TXT-02 | Seleção no texto | Alta | Usuário pode selecionar uma palavra/expressão diretamente no texto com mouse/toque. |
| TXT-03 | Popup de tradução | Alta | Ao selecionar texto, popup exibe termo selecionado, tradução e ação "Adicionar ao deck". |
| TXT-04 | Adicionar ao deck pessoal | Alta | Ao confirmar, client chama `addWordToLanguageDeck`; a palavra entra no deck pessoal do usuário para o idioma alvo. |
| TXT-05 | Lista de adicionadas | Média | Tela exibe palavras já adicionadas ao deck nesta leitura. |
| TXT-06 | Sem input livre no MVP | Alta | O usuário não cola texto nem URL; o texto é gerado pelo app a partir do tema, idioma e nível. |

---

### 3.4.2 Módulo: Deck Pessoal por Idioma

| ID | Requisito | Prioridade | Critério de Aceitação |
|----|-----------|------------|----------------------|
| LDK-01 | Deck único por idioma alvo | Alta | Cada usuário tem um deck pessoal para cada targetLang. |
| LDK-02 | Palavra adicionável | Alta | Palavra selecionada no texto é salva com word, translation, phonetic, example, exampleTranslation, tip, themeId e sourceTextId. |
| LDK-03 | Evitar duplicidade | Alta | Se a palavra já existe no deck daquele idioma, não cria duplicata; apenas retorna estado existente. |
| LDK-04 | Estudo do deck pessoal | Alta | Sessão de estudo usa cards do deck pessoal do idioma, não uma lista automática criada pela IA. |
| LDK-05 | Próximas palavras | Média | Se houver mais de 10 cards disponíveis, sessão seleciona até 10 cards novos ou pendentes. |

---

### 3.5 Módulo: Sessão de Estudo (Flashcards)

| ID | Requisito | Prioridade | Critério de Aceitação |
|----|-----------|------------|----------------------|
| STD-01 | Exibição do flashcard (frente) | Alta | Mostra: palavra no idioma alvo, pronúncia fonética, frase de exemplo. |
| STD-02 | Animação de flip | Alta | Ao tocar/clicar no card, animação 3D de flip revela o verso. Transição suave (0.6s). |
| STD-03 | Exibição do flashcard (verso) | Alta | Mostra: tradução, frase de exemplo com tradução, dica mnemônica. |
| STD-04 | Botões de feedback | Alta | Após o flip, exibir 3 botões: "Não sei" 😕 (vermelho), "Quase" 🤔 (amarelo), "Sei!" 🎯 (verde). |
| STD-05 | Animação de transição | Alta | Após responder, card sai com animação direcional e o próximo entra com bounce. |
| STD-06 | Barra de progresso | Alta | Barra no topo mostrando progresso na sessão (ex: "3 de 10"). |
| STD-07 | Contador de XP | Alta | XP ganho visível durante a sessão, incrementa em tempo real a cada resposta. |
| STD-08 | Botão de sair | Alta | Botão "✕ Sair" no header, retorna à seleção de temas. Cards já respondidos ficam salvos e, ao retomar o deck, o usuário volta no próximo card pendente. |
| STD-09 | Card não flipável pós-resposta | Média | Após responder, o card não pode ser flipado novamente (evita confusão). |
| STD-10 | Indicador de tema ativo | Média | Emoji e nome do tema visíveis no header durante o estudo. |

---

### 3.6 Módulo: Resumo da Sessão

| ID | Requisito | Prioridade | Critério de Aceitação |
|----|-----------|------------|----------------------|
| SUM-01 | Tela de resumo pós-sessão | Alta | Após o último card, exibe tela com resultados da sessão. |
| SUM-02 | Confetti em sessão boa | Alta | Se >= 70% "Sei!", confetti animado por 3 segundos. |
| SUM-03 | Mascote com humor contextual | Média | Mascote muda de expressão: excited (>=70%), happy (>=40%), thinking (<40%). |
| SUM-04 | Grid de estatísticas | Alta | 3 cards com contagem: Sei (verde), Quase (amarelo), Revisar (vermelho). |
| SUM-05 | XP ganho na sessão | Alta | Card destacado mostrando total de XP ganho e barra de progresso. |
| SUM-06 | Lista de palavras para revisar | Alta | Se houver palavras marcadas como "Não sei", listar com word + translation. |
| SUM-07 | Botão "Revisar palavras difíceis" | Alta | Inicia nova sessão apenas com as palavras marcadas como "Não sei". |
| SUM-08 | Botão "Ler novo texto" | Alta | Retorna para seleção de tema/texto para encontrar novas palavras. |
| SUM-09 | Botão "Trocar tema" | Alta | Retorna à tela de seleção de temas. |
| SUM-10 | Mensagem motivacional | Média | Mensagem contextual baseada no desempenho (ex: "Incrível! Você arrasou! 🏆"). |

---

### 3.7 Módulo: Revisão Diária (SM-2)

| ID | Requisito | Prioridade | Critério de Aceitação |
|----|-----------|------------|----------------------|
| REV-01 | Cálculo de cards para revisão | Alta | Cloud Function `getReviewCards` retorna palavras onde `nextReview <= hoje`. |
| REV-02 | Notificação de revisão pendente | Alta | Tela Estudar exibe badge com número de cards pendentes para revisão. |
| REV-03 | Sessão de revisão | Alta | Mesma mecânica da sessão de estudo, mas com cards vindos do algoritmo SM-2. |
| REV-04 | Atualização do SM-2 | Alta | Após cada resposta, client chama Cloud Function `submitCardAnswer`; a função recalcula easeFactor, interval, repetitions, nextReview, XP e streak. |
| REV-05 | Priorização | Alta | Cards mais atrasados (nextReview mais antigo) aparecem primeiro. |
| REV-06 | Limite por sessão | Média | Máximo de 20 cards por sessão de revisão. Se houver mais, dividir em múltiplas sessões. |
| REV-07 | Mistura de temas | Alta | Revisão diária mistura cards de todos os temas, não segrega por tema. |

---

### 3.8 Módulo: Gamificação

| ID | Requisito | Prioridade | Critério de Aceitação |
|----|-----------|------------|----------------------|
| GAM-01 | Sistema de XP | Alta | "Sei" = +15 XP, "Quase" = +8 XP, "Não sei" = +3 XP. XP acumula no perfil. |
| GAM-02 | Streak diário | Alta | Contador de dias consecutivos estudando. Reseta se pular um dia. |
| GAM-03 | Exibição do streak | Alta | Ícone 🔥 + número visível no header em todas as telas logadas. |
| GAM-04 | Níveis de domínio por palavra | Alta | 4 níveis: new 🆕, learning 🌱, reviewing 🌿, mastered 🌳. Calculado a partir do SM-2. |
| GAM-05 | XP total no header | Alta | Ícone ⚡ + XP total visível no header. |
| GAM-06 | Feedback visual de XP | Média | Animação de "+15 XP" flutuando ao responder corretamente. |
| GAM-07 | Recorde de streak | Baixa | Armazenar e exibir o maior streak já alcançado. |

---

### 3.9 Módulo: Estudar

| ID | Requisito | Prioridade | Critério de Aceitação |
|----|-----------|------------|----------------------|
| STDHOME-01 | Tela principal pós-login | Alta | Exibe: saudação com nome, streak, XP, revisões pendentes e grid de temas. |
| STDHOME-02 | Card de revisão pendente | Alta | Se há cards para revisar hoje, card destacado com badge de quantidade e botão "Revisar agora". |
| STDHOME-03 | Grid de temas | Alta | Lista os temas disponíveis para iniciar texto temático ou deck. |
| STDHOME-04 | Resumo rápido de progresso | Média | Exibe estatísticas resumidas quando houver dados suficientes, sem substituir a tela Progresso. |
| STDHOME-05 | Retomar deck ativo | Alta | Se houver deck com status `active`, exibe ação para retomar do próximo card pendente. |

---

### 3.10 Módulo: Progresso

| ID | Requisito | Prioridade | Critério de Aceitação |
|----|-----------|------------|----------------------|
| PRG-01 | Tela de progresso | Média | Visão geral do progresso do usuário em todos os temas. |
| PRG-02 | Progresso por tema | Média | Para cada tema estudado: total de palavras, distribuição por nível (new/learning/reviewing/mastered). |
| PRG-03 | Lista de vocabulário | Média | Lista de todas as palavras estudadas, filtrável por tema e nível de domínio. |
| PRG-04 | Estatísticas gerais | Baixa | Total de sessões, dias estudados, XP acumulado, streak atual vs recorde. |

---

### 3.11 Módulo: Configurações

| ID | Requisito | Prioridade | Critério de Aceitação |
|----|-----------|------------|----------------------|
| CFG-01 | Alterar idioma alvo | Média | Usuário muda o idioma que está aprendendo. Progresso anterior é mantido. |
| CFG-02 | Alterar nível | Média | Usuário muda seu nível. Afeta a complexidade dos próximos textos gerados. |
| CFG-03 | Alterar idioma nativo | Baixa | Usuário muda idioma nativo. |
| CFG-04 | Exibir informações da conta | Média | Nome, email, foto (se Google), data de criação. |
| CFG-05 | Deletar conta | Baixa | Opção para deletar conta e todos os dados associados. Confirmação obrigatória. |
| CFG-06 | Modo escuro | Alta | Usuário pode alternar entre tema claro e escuro. Preferência fica persistida no perfil. |

---

## 4. Requisitos Não-Funcionais

| ID | Categoria | Requisito | Meta |
|----|-----------|-----------|------|
| NF-01 | Performance | Tempo de carregamento inicial (LCP) | < 2.5 segundos |
| NF-02 | Performance | Tempo para adicionar palavra candidata ao deck | < 500ms |
| NF-03 | Performance | Tempo de geração de texto temático via IA | < 8 segundos |
| NF-04 | Performance | Animação de flip do flashcard | 60fps, sem jank |
| NF-05 | Responsividade | Mobile-first | Otimizado para 375px+ (iPhone SE como referência) |
| NF-06 | Responsividade | Desktop | Layout adaptado para telas >= 768px |
| NF-07 | Acessibilidade | Navegação por teclado | Tab, Enter, Espaço para flip e resposta |
| NF-08 | Acessibilidade | Contraste de cores | WCAG AA (mínimo 4.5:1 para texto) |
| NF-09 | Segurança | API key protegida | Chave da Claude API nunca exposta ao client |
| NF-10 | Segurança | Firestore rules | Cada usuário acessa apenas seus próprios dados |
| NF-11 | Segurança | Rate limiting | Máximo 10 gerações de deck / hora / usuário |
| NF-12 | Custo | Otimização de tokens | Textos gerados devem ser curtos e estruturados para controlar custo por leitura |
| NF-13 | Disponibilidade | Uptime | 99.5% (dependente do SLA Firebase) |
| NF-14 | Entrada | Página inicial | Página inicial exibe login/cadastro para visitantes e redireciona usuários autenticados para Estudar |

---

## 5. Fluxos de Usuário

### 5.1 Fluxo: Primeiro Acesso

```
Página inicial Login/Cadastro
  → Faz login (Google ou Email) → Onboarding
    → Seleciona idioma nativo → Seleciona idioma alvo
    → Seleciona nível → Estudar (primeiro acesso)
      → Grid de temas → Seleciona tema
        → Texto temático → Seleciona palavras no texto
        → Popup de tradução → Adiciona palavras ao deck pessoal
        → Sessão de estudo do deck pessoal (até 10 cards)
          → Flip + Resposta (repete 10x)
          → Tela de resumo
            → "Revisar difíceis" ou "Ler novo texto" ou "Trocar tema"
```

### 5.2 Fluxo: Acesso Recorrente

```
Abre o app → Sessão persistida → Estudar
  → Vê "8 cards para revisar hoje" (badge)
  → Clica "Revisar agora"
    → Sessão de revisão (cards do SM-2)
    → Resumo da revisão
  → Volta ao dashboard → Escolhe tema para novo estudo
```

### 5.3 Fluxo: Construção do Deck Pessoal (interno)

```
Usuário seleciona tema
  → Client chama Cloud Function generateStudyText
    → Chama Claude API para gerar texto e palavras candidatas
    → Salva texto em users/{uid}/studyTexts
    → Retorna texto
  → Usuário seleciona palavra no texto
    → Popup exibe tradução e botão "Adicionar ao deck"
    → Client chama Cloud Function addWordToLanguageDeck
    → Function cria/atualiza users/{uid}/languageDecks/{targetLang}
    → Function salva card em users/{uid}/languageDecks/{targetLang}/cards/{wordId}
  → Usuário inicia estudo
    → Sessão usa cards do deck pessoal do idioma
```

---

## 6. Wireframes de Referência (Descrição Textual)

### 6.1 Tela de Login

- Logo CardsAI (topo, centralizado)
- Mascote com expressão amigável
- Botão "Entrar com Google" (primário, verde)
- Divisor "ou"
- Campos email + senha
- Botão "Entrar" (secundário)
- Link "Criar conta" / "Esqueci minha senha"

### 6.2 Tela Estudar

- Header: logo à esquerda, streak 🔥 e XP ⚡ à direita
- Card de revisão (se houver): fundo destacado, "Você tem X palavras para revisar", botão "Revisar agora"
- Grid de temas (3 colunas mobile, 4 desktop): emoji + label + badge de progresso opcional
- Footer nav (mobile): Estudar, Progresso, Config

### 6.3 Flashcard (Frente)

- Header: botão sair, tema ativo
- Barra de progresso: "3 de 10" + XP
- Card centralizado (80% da largura):
  - Label "🇺🇸 PALAVRA"
  - Palavra grande (36px, bold)
  - Pronúncia fonética (14px, cinza)
  - Frase de exemplo em box sutil
  - "👆 Toque para ver a tradução" (verde)

### 6.4 Flashcard (Verso)

- Mesma estrutura do header e progresso
- Card flipado mostrando:
  - Label "TRADUÇÃO"
  - Tradução grande (28px, bold)
  - Box verde: frase original + tradução
  - Box amarelo: dica mnemônica
- 3 botões de feedback lado a lado (Não sei / Quase / Sei!)

### 6.5 Resumo da Sessão

- Mascote com expressão contextual
- Mensagem motivacional
- Grid 3 colunas: Sei / Quase / Revisar (com contagem)
- Card de XP ganho + barra de progresso
- Lista de palavras difíceis (se houver)
- Botões de ação empilhados

---

## 7. Critérios de Aceite Globais

- Todas as interações devem ter feedback visual (loading, sucesso, erro)
- Nenhuma tela deve ficar em estado de loading por mais de 8 segundos sem feedback
- Erros devem exibir mensagens amigáveis em português, nunca stack traces
- O app deve funcionar em Chrome, Safari e Firefox (últimas 2 versões)
- Gestos de swipe não são obrigatórios no web app MVP; ficam reservados para uma futura versão mobile nativa
- Dados do usuário sincronizados com Firestore em tempo real (latência < 1s)

---

## 8. Métricas de Sucesso do MVP

| Métrica | Meta | Como medir |
|---------|------|------------|
| Retenção D1 | >= 40% | Usuários que voltam no dia seguinte ao cadastro |
| Retenção D7 | >= 20% | Usuários que voltam 7 dias após cadastro |
| Sessões/dia por usuário | >= 1.5 | Média de sessões diárias por usuário ativo |
| Cards/sessão completados | >= 8 de 10 | Média de cards respondidos antes de sair |
| Palavras adicionadas por texto | >= 3 | Média de palavras adicionadas ao deck por texto lido |
| NPS | >= 40 | Pesquisa in-app após 7 dias de uso |

---

*Documento gerado em 01/06/2026 — CardsAI MVP Spec v1.0.0*
