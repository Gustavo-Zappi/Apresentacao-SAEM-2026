# Roteiro v2: Do vapor aos agentes de IA (SAEM 2026)

**Critério de sucesso:** o aluno sai entendendo que a IA já está na engenharia há décadas, que a IA generativa e os agentes abrem uma nova era, e que, como na eletrificação, o ganho vem de quem redesenha o processo.

## Estrutura (28 slides, ≈ 60 min com perguntas)

| # | Bloco | Conteúdo | Interação |
|---|---|---|---|
| 1-2 | Abertura | Capa com QR · quebra-gelo | Votação: uso de IA |
| 3-4 | Conexão pessoal | Trem Ki Voa, monitoria (5 disciplinas), IC em bombeamento · CSN → Ativos de TI → IA | Fotos opcionais |
| 5-8 | 01 · IA na engenharia | Linha do tempo 1987-2018 · fotos → 3D (animação 3D) · a IA passa a propor | |
| 9-11 | 02 · Agentes | Definição como malha fechada · demo: agente dimensiona uma bomba | Demo ao vivo (slide é backup) |
| 12-17 | 03 · Manchetes | Mural · Navier-Stokes · manchete × fato · escala de 10.000 agentes | Votação: a IA resolveu NS? |
| 18-21 | 04 · Já vimos esse filme | Pergunta da eletricidade · fábrica 3D em 6 passos · "estamos no ano 4" | Votação: quanto tempo levou? |
| 22-28 | 05 · Carreiras | Três gargalos · nuvem de palavras · frentes de carreira · três ações · perguntas | Nuvem + votação de trilha |

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
2. **Título:** trocado para "Do vapor aos agentes de IA" porque o Rankine saiu.
3. **Motivos da migração para TI e da chegada à IA:** estão nas notas como roteiro de fala, não no slide.
4. **Fotos:** `app/public/fotos/` (nomes em `LEIA-ME.txt`).
