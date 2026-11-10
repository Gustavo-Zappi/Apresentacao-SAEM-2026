# Análise e propostas v3: a palestra pela lente dos grandes pensadores

**SAEM 2026 · UFJF · 11/11/2026 · revisão de 09/11/2026**

**Critério de sucesso:** o aluno sai entendendo como a IA muda a engenharia, as empresas e a carreira, e lembra de uma imagem e de uma frase de cada parte.

**Título oficial (aplicado na capa):** Inteligência Artificial: transformando organizações e criando novas carreiras.

**Resumo oficial:** A Inteligência Artificial está mudando a forma como as organizações operam, tomam decisões e se estruturam. Nesta palestra, vamos ver como as empresas estão adotando a IA na prática, quais tecnologias estão por trás dessa transformação e que novas frentes de carreira em tecnologia e gestão estão se abrindo para os profissionais de engenharia.

> Numeração: `#n` é o número do link (`/palco#10.3` = slide 10, passo 3), começando em 0. O canto inferior esquerdo do palco mostra esse número (o direito ficou com o relógio).

## 1. Diagnóstico em uma página

| Dimensão | Avaliação | Implicação |
|---|---|---|
| Fio narrativo (vapor → elétrica → IA) | Forte. É o melhor ativo da palestra | Preservar. A versão revertida em 08/11 cortava justamente isso |
| Tecnologias por trás (#5 a #11) | Bem coberto, agora com imagem e exemplo de engenharia | Feito nesta versão |
| Como as empresas adotam IA na prática | **Lacuna.** Aparece só por analogia (#19, #20) e nos gargalos (#21) | Proposta de um slide na seção 5 deste documento |
| Carreiras (#22 a #26) | Lista correta, pouco memorável | Proposta de ancorar em uma frase e em um projeto (seção 4) |
| Tempo | 70,5 min previstos (60,5 de conteúdo + 10 de perguntas) | Se o slot total for 60 min, cortar cerca de 10 min (seção 6) |
| Visual | Antes: "cara de código". Agora: imagens reservadas, turbina, sistema de bombeamento e fábrica realista | Falta só você colocar as imagens (`app/public/imagens/LEIA-ME.md`) |

## 2. A lente dos pensadores

Harari raramente explica uma tecnologia. Ele explica **o que muda na forma como os humanos cooperam e decidem**. É exatamente a promessa do resumo oficial ("como as organizações operam, tomam decisões e se estruturam"). A palestra já tem a engenharia; falta dar a ela essa camada de sentido.

| Pensador | Ideia | Onde entra | Frase de palco (formulação sua, não citação) |
|---|---|---|---|
| Yuval Noah Harari, *Nexus* (2024) | A IA é o primeiro participante não humano das redes de informação: decide e cria ideias, não só executa ordens | Abertura da seção 02, #8 | "Até hoje, toda ferramenta esperava uma decisão humana. Esta é a primeira que decide." |
| Harari, *Sapiens* (2011) | Empresas são ficções compartilhadas: existem porque muita gente acredita na mesma história (o exemplo da Peugeot) | Slide de organizações (proposta da seção 5) | "Uma empresa é uma rede de pessoas que concordam em quem decide o quê. A IA entra nessa rede." |
| Harari, *21 lições para o século 21* (2018) | "Num mundo inundado de informações irrelevantes, clareza é poder" (frase de abertura do livro) | Seção 03, manchetes (#11 a #16) | Use como epígrafe do mural (#12). É a lição de Navier-Stokes |
| Harari, *21 lições*, capítulo sobre educação | O que mais vale é a capacidade de reaprender, não um conjunto fixo de respostas | Três ações (#26) | "O diploma de vocês não vence. O que vence é parar de aprender." |
| Andrew Ng (Stanford, 2017) | "IA é a nova eletricidade" | Abertura da seção 04, #17 | "Ng disse que IA é a nova eletricidade. Ele tinha mais razão do que imaginava: a eletricidade também demorou 40 anos para dar lucro." |
| Paul David, *The Dynamo and the Computer* (1990) | O ganho veio do redesenho da fábrica, não do motor | #19 (já usado) | Manter |
| Brynjolfsson, Rock e Syverson, *The Productivity J-Curve* (AEJ: Macro, 2021) | No início, a produtividade parece cair: a empresa investe em processo, dados e pessoas antes de colher | #20, "Estamos no ano 4" | "Se a sua empresa acha que a IA ainda não deu resultado, talvez ela esteja no fundo da curva J." |
| Agrawal, Gans e Goldfarb, *Prediction Machines* (2018) | A IA barateia a previsão; o que encarece é o julgamento | Fecho da demo, #10.8 | "A conta ficou barata. O julgamento ficou caro." |
| Garry Kasparov, *The Chess Master and the Computer* (NYRB, 2010) | Humano mediano + máquina + **processo melhor** vence o especialista com processo pior | #21, gargalos | "O que ganha não é o melhor jogador nem a melhor máquina. É o melhor processo." |
| Dell'Acqua, Mollick e outros, *Navigating the Jagged Technological Frontier* (HBS Working Paper 24-013, 2023) | A fronteira da IA é irregular: dentro dela, ganho grande; fora, erro com confiança | #21, "Validar" | "A IA é ótima até o ponto em que não é, e ela não avisa onde fica esse ponto." |
| Michael Polanyi, *The Tacit Dimension* (1966) | "Sabemos mais do que conseguimos dizer" | Carreiras, #24 | "O que você aprendeu no chão de fábrica e não cabe num prompt é o seu diferencial." |

**Conferir antes de projetar:** a tradução exata da frase de *21 lições* na edição brasileira; os números do estudo de Dell'Acqua et al. (citados com frequência como 12,2% mais tarefas, 25,1% mais rápido, qualidade 40% maior dentro da fronteira e 19 pontos percentuais a menos de acerto fora dela). Nas demais linhas, a coluna da direita é formulação sua, não citação.

## 3. Arco narrativo: o método Harari aplicado

Sem mudar a ordem dos slides:

1. **Abrir um enigma no início, fechá-lo no fim.** Depois da votação de abertura (#1), uma pergunta: "Em 1900, quem trocou a máquina a vapor por um motor elétrico ganhou quase nada. Por quê? Guardem essa pergunta." A resposta chega em #19 e volta no fechamento.
2. **Zoom out, zoom in.** Cada seção começa em séculos (vapor, eletricidade, Navier-Stokes) e termina em uma pessoa na plateia ("e você, na segunda-feira?").
3. **Uma frase-âncora por camada**, repetida no fechamento:
   - Engenharia: "A conta ficou barata. O julgamento ficou caro." (#10)
   - Organizações: "O ganho não vem da máquina nova, vem da fábrica redesenhada." (#19)
   - Carreiras: "Quem redesenha a fábrica são vocês." (#20 a #26)
4. **Honestidade sobre o medo.** Harari trata a ansiedade com franqueza. Na nuvem de palavras (#22), nomeie o medo e responda com o mecanismo (gargalos novos viram funções novas), sem prometer que todo emprego será preservado.

## 4. Propostas por slide

| # | Slide | Status | Proposta |
|---|---|---|---|
| 0 | Capa | **Feito** | Título oficial, linha "Do vapor aos agentes de IA" mantida como subtítulo |
| 2 | Trajetória: graduação | **Feito** | 2016 · Eng. Mecânica na UFSJ primeiro, depois AeroDesign, monitoria e IC. Foto `public/fotos/ufsj.jpg` |
| 4, 8, 11, 17, 23 | Aberturas de seção | **Feito (espaço)** | Fundo fotográfico opcional à direita; sem arquivo, o slide fica como antes |
| 5 | IA há décadas | **Feito (espaço)** | Uma imagem por marco (Sendai, vibração, ST5, Airbus, GM) |
| 6 | Fotos viram 3D | **Feito** | Turbina a vapor no lugar da engrenagem. Passo 2: campo de temperatura 480 °C → 41,5 °C (ciclo Rankine do conceito). Gancho de fala: escanear palhetas para reparo já é prática de manutenção |
| 7 | Agora a IA propõe | **Feito (espaço)** | Miniatura por linha (neural CAD, SimAI, LEAP 71, copiloto) |
| 8 | Seção 02 | Proposta | Kicker com a ideia de Harari: "A primeira tecnologia que decide" |
| 9 | O que é um agente | **Feito** | Passo 2: a malha abstrata vira a malha de vazão de um bombeamento (FT, FIC, inversor, setpoint), com as mesmas cores dos blocos |
| 10 | Demo | **Feito** | Sistema de bombeamento desenhado e dimensionado item a item, em 9 cliques. Proposta: terminar com "A conta ficou barata. O julgamento ficou caro." |
| 12 | Mural | **Feito (espaço)** | Foto em cada recorte de jornal. Proposta: epígrafe "clareza é poder" |
| 13 | Manchete | **Feito (espaço)** | Foto de escoamento turbulento no jornal |
| 15 | Manchete × fato | Proposta | Rechecar o status de Navier-Stokes antes de subir no palco (pendência do conceito) |
| 19 | Fábrica 3D | **Feito** | Cena realista e foto histórica em cada passo (`hist-*.jpg`) |
| 20 | Estamos no ano 4 | Proposta | Uma linha sobre a curva J: o começo parece decepcionante porque a empresa investe antes de colher |
| 21 | Três gargalos | **Feito (espaço)** | Foto por gargalo. Proposta: Kasparov no "Especificar" e fronteira irregular no "Validar" |
| 22 a 26 | Carreiras e fechamento | Proposta | Polanyi como ponte ("o que não cabe no prompt") e retorno ao enigma de 1900 |

## 5. A lacuna do resumo: "como as empresas estão adotando a IA na prática"

Hoje a palestra mostra a tecnologia (#5 a #16) e a história (#17 a #20), mas não mostra **uma empresa real decidindo**. Proposta de **um slide**, entre #20 e #21, usando os três verbos do resumo oficial:

| Operam | Decidem | Se estruturam |
|---|---|---|
| Agentes já executam processos de ponta a ponta: um incidente chega, o agente busca casos parecidos e a base de conhecimento, propõe a solução e fecha sozinho quando a confiança é alta | Quando a confiança é baixa, o agente documenta o que achou e passa para um especialista. **Alguém definiu esse limite.** Isso é decisão de gestão, não de software | Surgem papéis novos: dono funcional do agente (o que ele pode fazer), dono técnico (quem responde por falha), escopo de ação e **critério de suspensão** (o que faz desligar o agente) |

- **Fontes:** documentação ServiceNow, *Examples of using AI agents* ([link](https://github.com/ServiceNow/ServiceNowDocs/blob/96d32129bb43ac72057be47de4ffd83cf128813c/markdown/intelligent-experiences/ai-agent-examples.md)), e o post público da 4MATT *Governança de agentes de IA no ServiceNow*, tabela de atributos mínimos ([link](https://github.com/4MATTrepositorios/AI-Knowledge-RAG-RAW-Base/blob/896fc20568e45ffe77f9c498784659c407cfaa44/web/posts/2172-governanca-de-agentes-de-ia-servicenow.md)).
- **Ponte com a engenharia:** os atributos do agente são os mesmos de qualquer ativo crítico (dono, escopo, ciclo de vida, critério de parada). É gestão de ativos, a sua trajetória (CSN → ativos de TI → IA) em uma tabela.
- **Cuidado:** caso de cliente só anonimizado; tom de mercado, não de produto (ponto de atenção do conceito: não virar pitch).
- **Custo:** 3 min. Compensar com um dos cortes da seção 6.

## 6. Tempo

| Bloco | Slides | Previsto |
|---|---|---|
| Abertura e trajetória | #0 a #3 | 8,0 min |
| 01 · IA na engenharia | #4 a #7 | 10,5 min |
| 02 · Agentes | #8 a #10 | 9,5 min |
| 03 · Manchetes | #11 a #16 | 9,0 min |
| 04 · Já vimos esse filme | #17 a #20 | 10,0 min |
| 05 · Carreiras e fechamento | #21 a #26 | 13,5 min |
| Perguntas | #27 | 10,0 min |
| **Total** | | **70,5 min** |

A duração do slot ainda está em aberto no conceito. Se forem 60 min com perguntas, cortes sugeridos em ordem de menor perda: votação de Navier-Stokes #14 (1,5 min), escala #16 (1,5 min, vira uma frase em #15), nuvem de palavras #22 (2 min), votação de trilha #25 (2 min) e trajetória #3 de 3 para 1,5 min. Total: 8,5 min. Mais 1 min reduzindo o mural (#12) para 30 s.

## 7. O que mudou no app nesta versão

| Item | Onde |
|---|---|
| Título e resumo oficiais | `app/src/stage/speaker.ts` |
| Espaços de imagem com sugestão de busca e crédito | `app/src/data/images.ts`, `app/public/imagens/LEIA-ME.md` |
| Turbina 3D com campo de temperatura | `app/src/components/TurbineCloud.tsx` |
| Sistema de bombeamento (malha e dimensionamento) | `app/src/components/PumpSystem.tsx` |
| Fábrica realista: PBR, sombras, bloom, biela-manivela, correias, linha Ford, IA | `app/src/three/factory.ts` |
| Número `#slide.passo` no palco e nas notas | `app/src/stage/Deck.tsx`, `Notes.tsx` |
| Modo leve para notebook fraco | `/palco?q=baixa` |

**Números da demo, conferidos de novo (Colebrook):** v = 1,75 m/s; Re = 1,36·10⁵; f = 0,0199; hf = 4,8 m; hm = 1,25 m; H = 24,0 m; P no eixo = 2,80 kW; Joukowsky com a ≈ 1200 m/s: ΔH ≈ 214 m.

## 8. Para confirmar antes do dia 11/11/2026

1. Duração exata do slot (define se os cortes da seção 6 são necessários).
2. Status de Navier-Stokes (o conceito pede recheck em 04/11/2026; o slide #15 diz "em 28/10/2026").
3. Ensaiar a fábrica (#19) e a turbina (#6) **no notebook do projetor**. Se travar, usar `/palco?q=baixa`.
4. Imagens: licença e crédito de cada uma em `app/src/data/images.ts`.
5. Publicação na VPS segue o fluxo do README (somente Hermes publica).
