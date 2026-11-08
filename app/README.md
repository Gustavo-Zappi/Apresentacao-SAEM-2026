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
| R | Zerar respostas da pergunta atual |
| S | Simular votos (só modo local) |
| H | Ajuda |

## Banco e publicação (VPS)

- Banco: projeto Supabase **Banco de Apps**, ref `fupmaoucveabjvjlrmog`. Frontend usa somente a chave pública `anon`; a migration `supabase/migrations/20261108000000_saem_live.sql` cria apenas recursos próprios da palestra.
- O palco exige chave de apresentador, cujo SHA-256 fica no schema `saem_private` do banco. Hermes mantém a chave em arquivo local 0600 na VPS; Gustavo deve pedi-la a Hermes por canal seguro. Não coloque a chave em commits, logs, tickets ou mensagens; o link `/palco?key=...` a grava no localStorage do navegador e a remove da URL.
- Público: `https://saem2026.meetoliver.com.br/` (plateia), `/palco` (projetor) e `/notas` (notas). O QR aponta para a página da plateia.
- **Somente Hermes publica na VPS, quando Gustavo solicitar**. Outros agentes editam código, testes e documentação, enviam branch/PR e informam o commit; não acessam o servidor, não implantam migrations remotas e não alteram DNS ou segredos.
- Comandos, checklist e verificação: [`docs/operacao-vps.md`](../docs/operacao-vps.md). A infraestrutura de publicação versionada fica em `deploy/`. Commit/push não dispara deploy automático.
- Para ensaio sem Supabase, `npm run dev` sem `.env`: o modo local sincroniza apenas abas do **mesmo navegador**, não celulares reais.

## Editar conteúdo

| O quê | Onde |
|---|---|
| Perguntas e respostas certas | `src/data/questions.ts` |
| Ordem dos slides, notas e tempos | `src/stage/slides/index.tsx` |
| Nome, cargo e trajetória | `src/stage/speaker.ts` |
| Cores e tipografia (4MATT) | `src/styles.css` |

## Depois da palestra

Resultado consolidado: `select * from public.resultados;` no SQL Editor do projeto **Banco de Apps** (ou exporte a tabela `public.responses` em CSV).
