# App de palco SAEM 2026: pesquisa, decisão e arquitetura

**Critério de sucesso:** apresentação 100% web, animada, que roda no projetor e conversa com o celular da plateia via QR code, gravando cada resposta em banco, sem depender de ferramenta de terceiros (Mentimeter, Slido) e com plano B se a rede cair.

## Recomendação

Construir um app próprio em **React + Vite**, com **GSAP** como motor de animação, **Supabase** (Postgres) como banco e **Vercel** como hospedagem estática. Custo previsto: R$ 0 nos planos gratuitos para uma plateia de até algumas centenas de pessoas (ver capacidade abaixo).

## Por que GSAP é o frame ideal para animação

| Critério | GSAP | Motion (ex-Framer Motion) | Reveal.js / Slidev | Three.js / R3F |
|---|---|---|---|---|
| Modelo mental | Timeline: sequência coreografada de cliques, igual a uma palestra | Estado: anima mudanças de UI | Slides prontos com transições básicas | Cena 3D |
| Controle por clique (passos) | Nativo (timelines, labels, reverse) | Possível, mais verboso | Nativo, mas animação limitada | Manual |
| Texto cinético (letra a letra) | SplitText com máscara | Manual | Não | Não |
| Desenhar gráficos SVG (diagrama T-s) | DrawSVG, MorphSVG | Parcial | Não | Não |
| Licença | Gratuito inclusive plugins e uso comercial desde 2025 | MIT | MIT | MIT |
| Integração React | `@gsap/react` (`useGSAP`, limpeza automática) | Nativa | Vue (Slidev) | R3F |

**Decisão:** uma palestra é, por natureza, uma timeline. GSAP é o padrão de mercado para esse tipo de coreografia e, desde que a Webflow liberou todos os plugins, SplitText e DrawSVG saem de graça. Reveal.js e Slidev resolvem slides, não a interação com banco nem animação de dados ao vivo. Three.js seria exagero para o ganho visual.

## Arquitetura

| Rota | Quem usa | O que faz |
|---|---|---|
| `/palco` | Projetor | Slides 1920×1080 escalados, fundo de escoamento animado, perguntas com QR e resultados ao vivo |
| `/notas` | Notebook do apresentador | Notas por slide, cronômetro vs. roteiro, próximo slide, controle remoto (tecla O no palco abre) |
| `/` | Celular da plateia | Segue o palco sozinho: espera, pergunta, confirmação, revelação com confete |

Fluxo de uma pergunta:

1. O palco chega num slide de votação e grava `live_state = {pergunta, open}` via RPC protegida por chave.
2. Os celulares leem `live_state` a cada ~2 s (polling com jitter) e mostram a pergunta.
3. Cada voto vira uma linha em `responses`. A política RLS só aceita voto na pergunta aberta, um por participante.
4. O palco recebe os votos por Realtime (com polling de segurança) e anima as barras ou a nuvem de palavras.
5. No clique seguinte, o palco fecha a votação e revela a resposta certa no telão e nos celulares.

### Capacidade e limites (Supabase)

| Item | Free | Pro | Como o app trata |
|---|---|---|---|
| Conexões Realtime simultâneas | 200 | 500 | Só o palco usa Realtime. Celulares usam polling HTTP, sem conexão persistente |
| Mensagens Realtime/s | 100 | 500 | Só INSERTs de respostas chegam ao palco (1 mensagem por voto) |

Fonte: [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits). Com polling a cada 2 s, 200 celulares geram ~100 leituras/s de uma linha por chave primária: carga trivial para o Postgres.

### Segurança

| Ameaça | Mitigação |
|---|---|
| Aluno muda a pergunta no telão | Estado só muda via RPC `set_live_state`, que exige a chave do apresentador (hash SHA-256 em schema privado) |
| Voto duplicado | `unique (question_id, participant_id)` |
| Voto fora de hora | RLS: insert só quando a pergunta está `open` |
| Palavrão no telão | Filtro no celular e no palco; tecla R zera a pergunta |
| Dados pessoais | Nenhum. Participante é um UUID aleatório no navegador |

Testado em Postgres embarcado: leitura anônima, voto válido, bloqueio de voto duplicado, voto em pergunta fechada, update direto, delete, acesso ao schema privado e reset com chave.

## Plano B (internet do anfiteatro)

| Cenário | O que acontece |
|---|---|
| Rede do palco cai | Slides e animações continuam (tudo carregado no navegador). Votação pausa |
| Celulares sem Wi-Fi | Funcionam no 4G/5G; o app pesa ~170 kB gzip (medido no build) |
| Sem Supabase configurado | App entra em **modo local**: palco e celular sincronizam entre abas do mesmo navegador. Ideal para ensaio; tecla S simula votos |
| Navegador recarrega no meio | O palco volta ao mesmo slide e passo (hash na URL + localStorage) |

## Pendências antes de 11/11/2026

1. Criar o projeto Supabase, rodar a migration e trocar a chave do apresentador.
2. Deploy na Vercel com as variáveis de ambiente e um domínio curto para o QR.
3. Rechecar o status do caso Navier-Stokes (texto datado de 28/10/2026).
4. Completar a trajetória pessoal em `app/src/stage/speaker.ts`.
5. Ensaio completo com 3 ou 4 celulares reais na rede do anfiteatro, se possível.
