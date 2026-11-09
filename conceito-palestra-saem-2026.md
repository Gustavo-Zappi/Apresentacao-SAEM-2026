# Conceito da palestra: SAEM 2026 UFJF (v2, 28/10/2026)

**Tema oficial:** Inteligência Artificial: como a IA está transformando as organizações e abrindo novas frentes de carreira em tecnologia e gestão.

**Critério de sucesso:** o aluno de Engenharia Mecânica sai entendendo como a IA muda a engenharia e as empresas, e enxergando um caminho de carreira concreto (técnico ou de gestão) a partir da formação que já tem.

## Contexto do evento

| Item | Informação |
|---|---|
| Evento | II Semana Acadêmica da Engenharia Mecânica (SAEM), Faculdade de Engenharia da UFJF |
| Período | 09/11/2026 a 13/11/2026 |
| Sua palestra | Quarta-feira, 11/11/2026, 10h |
| Local | Anfiteatro 3, Edifício Itamar Franco, Campus Juiz de Fora |
| Público | Graduação e pós, professores, pesquisadores e profissionais da indústria |
| Eixos do evento | Manufatura; CAE; termociências; dinâmica e controle; manutenção e confiabilidade; energia |

## Fio narrativo

Três camadas, cada uma abrindo a próxima:

1. **A IA está mudando a engenharia** (Rankine e Navier-Stokes): o cálculo virou commodity; formular, verificar e decidir não.
2. **A IA está mudando as organizações**: trabalho de conhecimento em escala industrial (10.000 agentes em 88 h) cria novos gargalos: validação, governança de dados, propriedade intelectual.
3. **A IA está abrindo carreiras**: cada gargalo novo é uma função nova, em tecnologia e em gestão.

O caso Navier-Stokes é a ponte entre as três camadas: começa como notícia de engenharia, revela problemas organizacionais (crédito, dados, validação) e termina em carreira.

## Títulos candidatos

1. **De Rankine a Navier-Stokes:** a IA na engenharia, nas empresas e na sua carreira (recomendado)
2. **Do torno ao token:** como a IA está redesenhando as empresas e a carreira do engenheiro
3. **A manchete e a equação:** o que a IA muda (e o que não muda) para quem é engenheiro

## Roteiro (premissa: 60 min com perguntas)

| Bloco | Tempo | Conteúdo |
|---|---|---|
| Abertura | 4 min | "Eu sentei nessas cadeiras." Engenheiro mecânico que virou Head of AI |
| 1a. Rankine com IA | 10 min | Demo em três tempos (abaixo) |
| 1b. Navier-Stokes | 8 min | Manchete x fato x lições (abaixo) |
| 2. Organizações | 12 min | Do chão de fábrica ao escritório; agentes; os três novos gargalos; casos 4MATT anonimizados |
| 3. Carreiras | 12 min | Frentes em tecnologia e gestão; sua trajetória como prova |
| Fechamento | 4 min | Três ações para segunda-feira |
| Perguntas | 10 min | |

## Bloco 1a: demo do ciclo Rankine

**Problema (clássico de livro-texto):** ciclo Rankine ideal, vapor saturado a 8 MPa na entrada da turbina, condensador a 8 kPa, potência líquida de 100 MW. Calcular eficiência térmica, vazão de vapor e calor rejeitado.

**Valores de referência (calculados com CoolProp, conferem com o exemplo clássico de Moran & Shapiro):**

| Caso | η térmica | Título na saída da turbina | Vazão de vapor |
|---|---|---|---|
| A. Ideal, vapor saturado | 37,1% | 0,675 | 377 t/h |
| B. Ideal + superaquecimento a 480 °C | 39,7% | 0,795 | 286 t/h |
| C. B + reaquecimento a 0,7 MPa / 440 °C | 40,3% | 0,939 | 236 t/h |
| D. Real (η turbina e bomba = 85%), vapor saturado | 31,4% | 0,735 | 445 t/h |
| E. Real 85% + superaquecimento + reaquecimento | 35,1% | 0,996 | 278 t/h |
| Referência: Carnot entre 295 °C e 41,5 °C | 44,6% | | |

Trade-off de pressão (superaquecimento a 480 °C, ideal): 2 MPa → η 34,3%, x 0,888; 8 MPa → η 39,7%, x 0,795; 15 MPa → η 41,7%, x 0,744. Mais pressão, mais eficiência, mais umidade na turbina.

**Demo em três tempos:**

| Tempo | O que acontece | Mensagem |
|---|---|---|
| 1. "Como eu aprendi" | Foto da tabela de vapor e interpolação: cerca de 1 h por exercício | O método antigo |
| 2. "IA em 30 segundos" | Prompt ao vivo: a IA escreve o código, consulta propriedades e entrega 37,1% e 377 t/h | O cálculo virou commodity |
| 3. "A pergunta que só o engenheiro faz" | Título 0,675 = 32,5% de líquido na turbina: erosão das palhetas. Pede-se à IA superaquecimento, reaquecimento e varredura de pressão; o engenheiro decide o trade-off (material, custo, confiabilidade) | O valor migrou de calcular para formular, verificar e decidir |

**Contraponto de design:** não montar a demo apostando que a IA vai errar. Modelos atuais podem sinalizar a umidade sozinhos. A demo precisa funcionar nos dois cenários: se a IA acertar tudo, a pergunta vira "então o que sobra para você?" e a resposta é a decisão de projeto. Levar vídeo gravado de backup.

## Bloco 1b: Navier-Stokes, a manchete e o fato

**Status em 28/10/2026 (rechecar em 04/11/2026):**

| Manchete | Fato |
|---|---|
| "IA resolveu Navier-Stokes" | Em 08/09/2026 a OpenAI anunciou uma prova de **blow-up**: soluções de Navier-Stokes 3D que partem de condições suaves e formam singularidade em tempo finito, com força externa suave (permitida nos casos C e D da formulação oficial de Fefferman). Ou seja, a resposta à pergunta de regularidade seria **negativa** |
| "Problema do Milênio resolvido" | O Clay Mathematics Institute não reconheceu. Regra: publicação qualificada, dois anos de escrutínio, aceitação geral. O presidente do Clay, Martin Bridson, prometeu avaliação "deliberately unhurried". A OpenAI disse que não reivindicará o prêmio |
| "A IA fez sozinha" | Sistema interno com cerca de 10.000 agentes, 88 h, 2,7 milhões de mensagens, ~130 bilhões de tokens; formalização em Lean em ~17 h por outro modelo. Custo estimado em "vários milhões de dólares". Base intelectual de Córdoba e Martínez-Zoroa |
| "Vitória limpa" | Disputa de crédito: Buckmaster (NYU) e Alpöge (Anthropic) anunciaram resultados relacionados cerca de 12 h antes e questionaram se rascunhos enviados ao Codex influenciaram o modelo. A OpenAI nega acesso, mas não descarta uso de dados desidentificados |
| "Agora a CFD está resolvida" | Não. Fluidos reais são moleculares; sem consequência prática imediata (Quanta; professores de Cornell). RANS, LES e modelos de turbulência seguem iguais amanhã |

**Três lições, uma para cada camada da palestra:**

| Lição | Camada |
|---|---|
| Quem não sabe Navier-Stokes leu a manchete errado. O conhecimento de base é o que permite interpretar a IA | Engenharia |
| Escala (10.000 agentes) muda o jogo, mas cria gargalos novos: validação, crédito, uso de dados confidenciais em ferramentas de IA. As empresas vivem exatamente isso | Organizações |
| Cada gargalo vira uma função: quem verifica, quem governa os dados, quem decide o que pode entrar numa ferramenta de IA | Carreiras |

**Cuidado de palco:** apresentar como alegação em avaliação, nunca como fato consumado. Tom neutro entre empresas de IA. 25 medalhistas Fields publicaram declaração em 11/09/2026 sobre o desalinhamento entre objetivos das empresas de IA e da matemática; Terence Tao criticou o risco de expor só a rota vencedora.

## Bloco 2: organizações

- Chão de fábrica: manutenção preditiva, design generativo, simulação acelerada por modelos substitutos, gêmeo digital, inspeção visual de qualidade (cada um ligado a um eixo do evento; exemplos de mercado a validar antes de citar).
- Escritório e serviços: agentes que executam processos de TI, atendimento e back office (casos 4MATT anonimizados).
- Três novos gargalos: especificar bem, validar o resultado, governar dados e riscos.

## Bloco 3: frentes de carreira

| Trilha | Frente | Ponte a partir da Mecânica |
|---|---|---|
| Tecnologia | IA aplicada à manufatura e Indústria 4.0 | Processos, automação, qualidade |
| Tecnologia | Simulação acelerada por IA e gêmeo digital | CAE, FEA, CFD, termociências |
| Tecnologia | Confiabilidade e manutenção preditiva | Vibrações, manutenção, confiabilidade |
| Tecnologia | Engenharia de soluções e agentes de IA | Pensamento sistêmico, controle |
| Tecnologia | Verificação e validação de IA | Metrologia, ensaios, normas |
| Gestão | Transformação e consultoria com IA | Processos, gestão de projetos |
| Gestão | Product management de IA | Projeto de produto, requisitos |
| Gestão | Governança, risco e compliance de IA | FMEA, segurança, normas |
| Gestão | Liderança de IA (Head of AI) | Sua trajetória |

## Fechamento: três ações para segunda-feira

1. Use IA como colega de estudo, verificando a resposta como verificaria uma conta.
2. Faça um projeto que junte mecânica e dados ou IA (TCC, iniciação científica, equipe de competição).
3. Aprenda a especificar bem: quem escreve a melhor especificação comanda a ferramenta.

## Pontos de atenção

- Não virar pitch de 4MATT ou ServiceNow; casos de clientes anonimizados.
- Jargão sempre com analogia mecânica.
- Ansiedade de carreira tratada com honestidade: tarefas de nível inicial são as mais expostas.
- Números de mercado só com fonte atual verificada.
- Internet do anfiteatro: vídeo de backup para a demo.

## Perguntas em aberto

- Duração exata do slot.
- Infraestrutura: projetor, internet, microfone.
- Vagas ou estágio na 4MATT para chamada final.

## Fontes

- [Semana Acadêmica da Engenharia Mecânica, UFJF](https://www2.ufjf.br/semanaengmec/)
- [Quanta Magazine, 08/09/2026](https://quantamagazine.org/ai-has-solved-one-of-maths-1-million-millennium-prize-problems-20260908)
- [ABC News, 10/09/2026](https://www.abc.net.au/news/2026-09-10/openai-navier-stokes-millennium-problem-claims/107132242)
- [Implicator: posição do Clay Institute](https://www.implicator.ai/clay-institute-navier-stokes-openai-proof-claim.md)
- [The Cornell Daily Sun, 10/2026](https://www.cornellsun.com/article/2026/10/openai-claims-it-solved-the-navier-stokes-problem-we-asked-cornell-professors-what-this-means-for-the-future-of-research)
- [No, AI hasn't officially solved Navier–Stokes. Yet](https://manlius.substack.com/p/no-ai-hasnt-officially-solved-navierstokes)
- [Xataka Brasil](https://www.xataka.com.br/informatica/openai-afirma-que-sua-ia-resolveu-problema-matematico-92-anos)
