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

## Ligar o banco (Supabase)

1. Crie um projeto em supabase.com (região São Paulo, `sa-east-1`).
2. SQL Editor: rode `supabase/migrations/20261108000000_saem_live.sql`.
3. Troque a chave do apresentador:
   ```sql
   update private.config
      set value = encode(extensions.digest('SUA-CHAVE-FORTE', 'sha256'), 'hex')
    where key = 'presenter_key_sha256';
   ```
4. Copie `.env.example` para `.env` e preencha URL e anon key (Project Settings > API).
5. Abra o palco uma vez com `/palco?key=SUA-CHAVE-FORTE`. A chave fica salva no navegador e some da URL.
   O indicador no canto inferior direito fica verde: **ao vivo**.

## Deploy (Vercel)

1. Importe o repositório na Vercel e defina **Root Directory = `app`**.
2. Variáveis: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PUBLIC_URL` (domínio final, vai no QR).
3. `vercel.json` já trata as rotas `/palco` e `/notas`.

## Editar conteúdo

| O quê | Onde |
|---|---|
| Perguntas e respostas certas | `src/data/questions.ts` |
| Ordem dos slides, notas e tempos | `src/stage/slides/index.tsx` |
| Nome, cargo e trajetória | `src/stage/speaker.ts` |
| Cores e tipografia (4MATT) | `src/styles.css` |

## Depois da palestra

Resultado consolidado: `select * from resultados;` no SQL Editor (ou exporte a tabela `responses` em CSV).
