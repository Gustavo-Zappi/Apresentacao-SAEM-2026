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
| O | Abrir janela de notas e cronômetro |
| K | Informar a chave do apresentador (fica salva neste navegador) |
| R | Zerar respostas da pergunta atual |
| S | Simular votos (só modo local) |
| H | Ajuda |

## Numeração e desempenho

- O canto inferior esquerdo mostra o estado da sincronia, `#slide.passo` (o mesmo número do link, começando em 0) e a posição `n/total`.
- O canto inferior direito de todos os slides mostra o relógio: hora de Brasília (`America/Sao_Paulo`), `HH:MM:SS`, atualizada a cada segundo. Ele não depende do fuso do notebook e some na tela preta (**B**).
- Notebook fraco no projetor: abra `/palco?q=baixa`. A fábrica 3D desliga sombras e bloom e reduz a resolução interna.

## Banco e publicação (VPS)

- Banco: projeto Supabase **Banco de Apps**, ref `fupmaoucveabjvjlrmog`. Frontend usa somente a chave pública `anon`; a migration `supabase/migrations/20261108000000_saem_live.sql` cria apenas recursos próprios da palestra.
- O palco exige chave de apresentador, cujo SHA-256 fica no schema `saem_private` do banco. Hermes mantém a chave em arquivo local 0600 na VPS; Gustavo deve pedi-la a Hermes por canal seguro. Não coloque a chave em commits, logs, tickets ou mensagens; o link `/palco?key=...` a grava no localStorage do navegador e a remove da URL.
- Público: `https://saem2026.meetoliver.com.br/` (plateia), `/palco` (projetor) e `/notas` (notas). O QR aponta para a página da plateia.
- **Somente Hermes publica na VPS, quando Gustavo solicitar**. Outros agentes editam código, testes e documentação, enviam branch/PR e informam o commit; não acessam o servidor, não implantam migrations remotas e não alteram DNS ou segredos.
- Comandos, checklist e verificação: [`docs/operacao-vps.md`](../docs/operacao-vps.md). A infraestrutura de publicação versionada fica em `deploy/`. Commit/push não dispara deploy automático.
- Para ensaio sem Supabase, `npm run dev` sem `.env`: o modo local sincroniza apenas abas do **mesmo navegador**, não celulares reais.

## Checklist do dia (5 min)

1. No notebook do projetor, abra `/status`. Tudo deve estar ✓. Se "Chave do apresentador" estiver ✗, abra `/palco` e tecle **K**.
2. Em `/palco`, o indicador no canto inferior esquerdo deve dizer **ao vivo** (verde). Em amarelo, ele diz o motivo; clicar nele pede a chave.
3. Vá ao slide 2 (primeira votação) e responda com o seu celular. O voto deve aparecer no telão em até 3 s.
4. Se votou em ensaio, tecle **R** no slide de cada pergunta para zerar antes da palestra.

## Editar conteúdo

| O quê | Onde |
|---|---|
| Perguntas e respostas certas | `src/data/questions.ts` |
| Ordem dos slides, notas e tempos | `src/stage/slides/index.tsx` |
| Nome, cargo e universidade | `src/stage/speaker.ts` |
| Fotos da trajetória | `public/fotos/` (ver `LEIA-ME.txt`) |
| Imagens ilustrativas dos slides (nome, sugestão de busca, crédito) | `public/imagens/` (ver `LEIA-ME.md`) e `src/data/images.ts` |
| Título e resumo oficiais | `src/stage/speaker.ts` |
| Cena 3D da fábrica (vapor → elétrica → linha → IA) | `src/three/factory.ts` |
| Turbina do slide #6 (fotos → nuvem → modelo → simulação) | `src/components/TurbineCloud.tsx` |
| Sistema de bombeamento dos slides #9 e #10 | `src/components/PumpSystem.tsx` |
| Cores, tipografia, superfícies e sombras (tokens 4MATT) | `src/styles.css`, bloco `:root` |
| Curvas e durações das animações | `src/lib/motion.ts` |
| Coreografia padrão do slide (entrada, passos, foco) | `src/components/Slide.tsx` |
| Ícones (grade 48, traço único) | `src/components/Icons.tsx` |
| Relógio de Brasília | `src/components/Clock.tsx` |

## Sistema visual e de movimento

O palco segue um sistema só. Ao criar ou ajustar um slide, use o que já existe antes de inventar um valor.

| Tema | Regra |
|---|---|
| Paleta | Marca 4MATT (`#201E4B`, `#58178B`, `#9156F1`, branco) e quatro cores funcionais com sentido fixo: verde (certo, ao vivo), âmbar (atenção, item em análise), vermelho (risco), azul (fluido). Texto de destaque usa o lilás `#CBB3FF`. |
| Tipografia | Poppins para leitura, JetBrains Mono para rótulos e dados. Texto de leitura a partir de 28 px no quadro 1920×1080. |
| Superfícies | Cartão, quadro e painel usam os mesmos tokens de fundo, borda (2 px), raio e sombra. |
| Entrada do slide | Marque com `data-in` (e variações `fade`, `scale`, `left`, `right`, `draw`) na ordem de leitura; o título recebe `data-split`. |
| Passos | `data-step="n"` aparece no clique n. Filhos com `data-sub` entram em cascata. `focus` no `<Slide>` faz os passos anteriores recuarem. |
| Item da vez | Cada passo recebe `data-state` (`now`, `past`, `future`): o CSS acentua o item atual (borda, número, filete). |
| Curvas | Entrar desacelerando, sair acelerando, deslocar com `inOut`. Sem `elastic` nem `bounce`. Uma revelação por clique termina em menos de 0,8 s. |
| Estado × animação | O GSAP anima opacidade e posição do elemento marcado; estados em CSS usam borda, fundo, sombra ou elementos filhos. Não aplique `transition` de opacidade no mesmo elemento que o GSAP anima. |

## Depois da palestra

Resultado consolidado: `select * from public.resultados;` no SQL Editor do projeto **Banco de Apps** (ou exporte a tabela `public.responses` em CSV).
