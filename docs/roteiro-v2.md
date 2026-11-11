# Roteiro v2: Do vapor aos agentes de IA (SAEM 2026)

**Critério de sucesso:** o aluno sai entendendo que a IA já está na engenharia há décadas, que a IA generativa e os agentes abrem uma nova era, e que, como na eletrificação, o ganho vem de quem redesenha o processo.

## Estrutura (26 slides, ≈ 68 min: 58 de conteúdo + 10 de perguntas)

Numeração igual à do palco: `#n` no link e no canto da tela (`/palco#10.3` = slide 10, passo 3). Versão alinhada ao deck de 11/11/2026.

| # | Bloco | Conteúdo | Interação | Tempo |
|---|---|---|---|---|
| 0-3 | Abertura e trajetória | Capa com QR · graduação (UFSJ, Trem Ki Voa, monitoria, IC em bombeamento) · carreira (CSN → Ativos de TI → pós USP → IA) | Votação 1: uso de IA (#3) · fotos reais nos cards | 8,5 min |
| 4-7 | 01 · IA na engenharia | Linha do tempo 1987-2018 com fotos · fotos → 3D (turbina a vapor e simulação) · a IA passa a propor | | 10,5 min |
| 8-10 | 02 · Agentes | Agente como malha fechada, com malha de vazão 3D simulada · demo: agente dimensiona o sistema de bombeamento | Demo ao vivo (slide é backup) | 9,5 min |
| 11-15 | 03 · Manchetes | Mural · Navier-Stokes · manchete × fato · escala de 10.000 agentes | | 7,5 min |
| 16-18 | 04 · Já vimos esse filme | Pergunta retórica da eletricidade · fábrica 3D em 6 passos · "estamos no ano 4" | | 8,5 min |
| 19-24 | 05 · Quem vai redesenhar o processo | Três gargalos · oportunidades por setor (Ipea) e onde a 4MATT atua · frentes de carreira para quem vem da engenharia · três ações | Votação 2: frente de carreira (#23) | 13,5 min |
| 25 | Perguntas | | | 10 min |

**Slides que se montam sozinhos (sem cliques):** #1, #2, #5, #9, #15, #18 e #19.

**Mudanças de 11/11/2026:** novo slide de oportunidades por setor (#21, fonte Ipea) com o card da 4MATT; seção 05 renomeada para "Quem vai redesenhar o processo"; card da fábrica (#17) só com texto, no canto inferior esquerdo; 4MATT presente no discurso em #2, #9, #19, #21, #22 e #25.

**Mudanças em relação à versão de 28 slides:**
- A votação de uso de IA passou para depois da trajetória (#3).
- Saíram três interações: votação de Navier-Stokes, votação da eletricidade e nuvem de palavras. A pergunta da eletricidade virou pergunta retórica na abertura da seção 04 (#16); o "alegação em avaliação" fecha o manchete × fato (#14); a resposta à ansiedade da plateia foi para os gargalos (#19).
- O slide "O que é um agente" (#9) mostra o ciclo ao lado de uma malha de vazão de bombeamento em 3D, com perturbação a cada ~11 s.

Fala completa, teoria e perguntas prováveis de cada slide: [`roteiro-palestra-saem-2026.html`](roteiro-palestra-saem-2026.html).

## Fontes dos fatos no telão

| Fato | Fonte |
|---|---|
| Metrô de Sendai com lógica fuzzy (Hitachi), 1987 | [History of train automation](https://en.wikipedia.org/wiki/History_of_train_automation) |
| NASA ST5: antena por algoritmo evolutivo, voo de 22/03 a 30/06/2006 | [NASA NTRS](https://ntrs.nasa.gov/citations/20060024675) |
| Airbus, partição biônica, 2015, 45% mais leve | [Airbus](https://www.airbus.com/en/newsroom/news/2016-03-pioneering-bionic-3d-printing) |
| GM + Autodesk, suporte 40% mais leve, 20% mais resistente, 8 peças em 1 (05/2018, prova de conceito) | [Modern Machine Shop](https://www.mmsonline.com/news/what-this-seat-bracket-says-about-the-future-of-automotive-manufacturing) |
| 3D Gaussian Splatting, SIGGRAPH 2023 | [arXiv 2308.04079](https://huggingface.co/papers/2308.04079) |
| TRELLIS.2 (Microsoft), 12/2025, MIT | Agregadores ([3D AI Studio](https://www.3daistudio.com/blog/trellis-2-vs-hunyuan-3d-differences-explained)); confirmar no repositório oficial |
| Zoo Text-to-CAD, sólidos B-rep | [Zoo](https://docs.zoo.dev/research/introducing-text-to-cad) |
| Autodesk neural CAD, AU 2025 | [Autodesk](https://www.autodesk.com/design-make/articles/neural-cad) |
| Ansys SimAI, 09/01/2024, "10-100× mais rápido" (afirmação da Ansys) | [Ansys](https://www.ansys.com/news-center/press-releases/1-9-24-ansys-launches-simai) |
| LEAP 71: motor projetado por modelo computacional, 5 kN, 2024 | [Metal AM](https://www.metal-am.com/leap-71-hot-fires-additively-manufactured-rocket-engine-designed-without-human-intervention/) |
| Eletrificação: motores ≈5% da força motriz (1899), ≈50% (≈1920), ganho só com o redesenho da fábrica | Paul A. David, "The Dynamo and the Computer", AER P&P, 1990 ([resumo](https://dynamo-computer.pages.dev/)) |
| Ford Highland Park, linha de montagem em 07/10/1913 | [Highland Park Ford Plant](https://en.wikipedia.org/wiki/Highland_Park_Ford_Plant) |
| Oportunidades por setor (#21) | Ipea (confirmar publicação, ano e base) |
| 4MATT: ServiceNow Elite Partner; Technology Excellence Partner Award 2024 e 2025 | [4matt.com.br](https://4matt.com.br/) |
| Navier-Stokes, escala e disputa | `conceito-palestra-saem-2026.md` (status de 28/10/2026, rechecar) |

## Demo do agente: números conferidos

Água a 20 °C, 30 m³/h, DN 80 (D = 77,9 mm), 120 m, desnível 18 m, aço comercial ε = 0,045 mm, Colebrook, K acessórios = 8, η bomba = 70%:
v = 1,75 m/s · Re = 1,36·10⁵ · f = 0,0199 · hf = 4,78 m · hm = 1,25 m · **H = 24,0 m** · P eixo = **2,8 kW** (motor de 4 kW). Joukowsky com a ≈ 1200 m/s: **ΔH ≈ 214 m** (pior caso, fechamento instantâneo).

## Projetor

- Texto mínimo de ≈ 28 px no quadro 1920×1080; corpo de 30 a 40 px; títulos de 64 a 136 px.
- O roxo da marca (#9156F1) fica em 3,6:1 sobre o fundo escuro. Ele é usado só em títulos grandes e preenchimentos; textos de destaque usam #CBB3FF (8,5:1).
- Partículas do fundo mais fracas nos slides de conteúdo e desligadas nos slides 3D.
- Recomendação: reduzir a luz perto da tela.

## A confirmar pelo palestrante

1. **Universidade:** a busca pública associa a Trem Ki Voa e a IC (Pellegrini, Zappi e Vilalta, ERMAC-RS 2020) à **UFSJ**. O slide diz "Engenharia Mecânica · UFSJ" (`app/src/stage/speaker.ts`).
2. **Título:** em 09/11/2026 a capa passou a usar o título oficial, "Inteligência Artificial: transformando organizações e criando novas carreiras". "Do vapor aos agentes de IA" ficou como subtítulo. Propostas da v3: [`analise-v3-pensadores.md`](analise-v3-pensadores.md).
3. **Motivos da migração para TI e da chegada à IA:** estão nas notas como roteiro de fala, não no slide.
4. **Fotos:** ficam em `app/src/images/`. A ligação de cada card com o arquivo está em `app/src/data/fotos.ts` (`FOTO_ARQUIVO`, slides #1 e #2) e em `app/src/data/images.ts` (campo `src`, slide #5). O card da monitoria (#1) ainda não tem foto.
5. **Créditos das imagens de terceiros (#5):** NASA, Airbus e GM/Autodesk estão sem crédito na tela; preencher `credit` em `app/src/data/images.ts`.
