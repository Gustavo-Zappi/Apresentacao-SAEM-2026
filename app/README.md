# SAEM 2026: app de palco interativo

Apresentação web animada (GSAP) com votação da plateia por QR code gravada no Supabase.
Decisões e arquitetura: [`docs/app-palco-arquitetura.md`](../docs/app-palco-arquitetura.md).

## Rodar localmente (modo ensaio, sem banco)

```bash
cd app
npm install
npm run dev
```

- Palco: http://localhost:5173/palco
- Plateia: http://localhost:5173/ (abra em outra aba ou janela)
- Notas: tecla **O** no palco

Sem variáveis do Supabase o app roda em **modo local**: palco e plateia sincronizam entre abas do mesmo navegador. Tecla **S** simula votos.

## Atalhos do palco

| Tecla | Ação |
|---|---|
| → espaço PgDn | Avançar (clicker funciona) |
| ← PgUp | Voltar |
| F | Tela cheia |
| B ou . | Tela preta |
| C | Modo projetor (mais contraste) liga/desliga. Vem **ligado**; fica salvo no navegador |
| T | Relógio digital (hora de Brasília) no canto inferior direito: mostra/oculta |
| O | Abrir janela de notas e cronômetro |
| K | Informar a chave do apresentador (fica salva neste navegador) |
| R | Zerar respostas da pergunta atual |
| S | Simular votos (só modo local) |
| H | Ajuda |

## Roteiro de cliques e votações

- **Só duas perguntas ao público**: `#3` (uso de IA, logo depois da apresentação pessoal) e `#22` (frente de carreira, no fechamento). As outras perguntas continuam em `src/data/questions.ts`, fora do deck; para trocar a pergunta final pela nuvem de palavras, use `poll('p-palavra', 'palavra', ...)` no lugar de `p-trilha` em `src/stage/slides/index.tsx`.
- **Sem cliques intermediários** (o slide se monta sozinho, fale por cima): `#1` e `#2` (trajetória), `#5` (IA há décadas), `#9` (o que é um agente), `#15` (escala), `#18` (estamos no começo) e `#19` (gargalos).
- **Com cliques**: turbina `#6` (3), nova era `#7` (4), demo da bomba `#10` (9), mural `#12` (2), manchete `#13` (2), manchete × fato `#14` (6), fábrica `#17` (6), carreiras `#21` (2), ações `#23` (3) e as duas votações (2 cada).

## Numeração e desempenho

- O canto inferior direito mostra `#slide.passo` (o mesmo número do link, começando em 0) e a posição `n/total`.
- Notebook fraco no projetor: abra `/palco?q=baixa`. As cenas 3D (turbina, bomba e fábrica) desligam sombras e bloom, reduzem partículas e a resolução interna.
- **Modo projetor** (indicador `◐ projetor` no canto): levanta sombras e exposição das cenas 3D, deixa o texto secundário em branco pleno e reduz as partículas do fundo. Se no anfiteatro a imagem ficar estourada, tecle **C** para desligar (ou abra `/palco?projetor=0`).

## Banco e publicação (VPS)

- Banco: projeto Supabase **Banco de Apps**, ref `fupmaoucveabjvjlrmog`. Frontend usa somente a chave pública `anon`; a migration `supabase/migrations/20261108000000_saem_live.sql` cria apenas recursos próprios da palestra.
- O palco exige chave de apresentador, cujo SHA-256 fica no schema `saem_private` do banco. Hermes mantém a chave em arquivo local 0600 na VPS; Gustavo deve pedi-la a Hermes por canal seguro. Não coloque a chave em commits, logs, tickets ou mensagens; o link `/palco?key=...` a grava no localStorage do navegador e a remove da URL.
- Público: `https://saem2026.meetoliver.com.br/` (plateia), `/palco` (projetor) e `/notas` (notas). O QR aponta para a página da plateia.
- **Somente Hermes publica na VPS, quando Gustavo solicitar**. Outros agentes editam código, testes e documentação, enviam branch/PR e informam o commit; não acessam o servidor, não implantam migrations remotas e não alteram DNS ou segredos.
- Comandos, checklist e verificação: [`docs/operacao-vps.md`](../docs/operacao-vps.md). A infraestrutura de publicação versionada fica em `deploy/`. Commit/push não dispara deploy automático.
- Para ensaio sem Supabase, `npm run dev` sem `.env`: o modo local sincroniza apenas abas do **mesmo navegador**, não celulares reais.

## Checklist do dia (5 min)

1. No notebook do projetor, abra `/status`. Tudo deve estar ✓. Se "Chave do apresentador" estiver ✗, abra `/palco` e tecle **K**.
2. Em `/palco`, o indicador no canto inferior direito deve dizer **ao vivo** (verde). Em amarelo, ele diz o motivo; clicar nele pede a chave.
3. Vá ao slide `#3` (primeira das duas votações, logo depois da trajetória) e responda com o seu celular. O voto deve aparecer no telão em até 3 s.
4. Se votou em ensaio, tecle **R** no slide de cada pergunta para zerar antes da palestra.

## Editar conteúdo

| O quê | Onde |
|---|---|
| Perguntas e respostas certas | `src/data/questions.ts` |
| Ordem dos slides, notas e tempos | `src/stage/slides/index.tsx` |
| Nome, cargo e universidade | `src/stage/speaker.ts` |
| Fotos da trajetória (#1 e #2) | `src/images/` com o nome do espaço (ex.: `usp.jpg`) ou mapeadas em `src/data/fotos.ts`; o formato antigo `public/fotos/` continua valendo |
| Imagens ilustrativas dos slides (nome, sugestão de busca, crédito) | `public/imagens/` (ver `LEIA-ME.md`) e `src/data/images.ts` |
| Título e resumo oficiais | `src/stage/speaker.ts` |
| Cena 3D da fábrica (vapor → elétrica → linha → IA) | `src/three/factory.ts` |
| Turbina do slide #6 (fotos → nuvem → modelo → simulação) | `src/components/TurbineCloud.tsx` |
| Sistema de bombeamento 3D dos slides #9 e #10 | Cena: `src/three/pump.ts` · etiquetas, plano e balões: `src/components/PumpSystem.tsx` |
| Slides que se montam sozinhos (instantes de cada item) | `auto(Componente, [segundos...])` em `src/stage/slides/index.tsx` |
| Cores e tipografia (4MATT) | `src/styles.css` |

## Depois da palestra

Resultado consolidado: `select * from public.resultados;` no SQL Editor do projeto **Banco de Apps** (ou exporte a tabela `public.responses` em CSV).
