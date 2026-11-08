# Operação SAEM 2026 — VPS e Supabase

**Responsável exclusivo pelo deploy:** Hermes, mediante pedido de Gustavo. Outros agentes podem desenvolver e enviar branch/PR, mas não devem aplicar migrations remotas, editar DNS, segredos, serviços Docker ou publicar na VPS. GitHub não tem deploy automático. Código fonte: `app/`; arquivos operacionais: `deploy/`.

## Topologia da V1

- Domínio `saem2026.meetoliver.com.br` (DNS A gerenciado por Gustavo, aponta para `137.131.138.21`). HTTPS via Traefik Swarm (`traefik_public`, `websecure`, resolver `le`).
- `deploy/stack.yml` cria somente `saem2026_web`, nginx com build estático React/Vite; sem porta publicada. `deploy/nginx.conf` faz fallback SPA para `/palco` e `/notas` e limita conexões do navegador ao Supabase. Artefatos em `/home/ubuntu/services/saem2026/www`; configuração nginx em `/home/ubuntu/services/saem2026/nginx.conf`.
- Supabase projeto **Banco de Apps**, ref `fupmaoucveabjvjlrmog`, São Paulo. Tabelas próprias `public.live_state`, `public.responses`, view `public.resultados` e schema `saem_private`; outras tabelas do projeto compartilhado não devem ser alteradas. Frontend usa somente a chave `anon` pública. Nenhuma chave de `service_role`/`sb_secret_*` deve aparecer no build.
- `/` plateia, `/palco` projetor, `/notas` janela de notas. QR aponta para `/`. O app usa Supabase diretamente via HTTPS/WebSocket, não há API na VPS nem SQLite.

## Segurança e preparação inicial (somente Hermes)

1. Inspecionar `git status`, `git fetch`, diff/revisão e o estado das tabelas remotas antes de escrever. Confirmar que migration não colide com objetos de outros apps.
2. Aplicar `supabase/migrations/20261108000000_saem_live.sql` via Supabase CLI no projeto **explicitamente** `fupmaoucveabjvjlrmog`. Essa migration não instala chave padrão.
3. Gerar uma chave aleatória longa e registrar somente o SHA-256 em `saem_private.config` via canal privado. Não comitar/imprimir a chave. Guardar em arquivo 0600 da VPS (`/home/ubuntu/services/saem2026/presenter-key.txt`); Gustavo deverá pedi-la a Hermes por canal seguro antes da palestra. A rota `/palco?key=...` grava a chave no armazenamento local do navegador e a remove da barra; evite compartilhar URL com chave em links públicos. Se a chave for perdida, girar o hash no banco.
4. A URL e a chave `anon` são públicas, incorporadas no bundle Vite. Obter a `anon` pelo Supabase CLI sem imprimir `service_role`; gerar `app/.env.production.local` (ignorado pelo Git) com `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_PUBLIC_URL=https://saem2026.meetoliver.com.br`. Nunca usar uma chave secreta em `VITE_*`.
5. Conferir RLS, permissões, RPCs, estado inicial e Realtime. Testar voto aberto, duplicado, fechado, reset e chave inválida com requisições anon. Não gravar votos de teste permanentes em perguntas reais (removê-los com reset autorizado).

## Build e publicação (somente Hermes)

No diretório do repositório, após aprovação do commit e inspeção do diff:

```sh
cd app
npm ci
npm run build
cd ..
# Copiar app/dist/ para /home/ubuntu/services/saem2026/www e ajustar arquivos/diretórios para 0644/0755;
# manter /home/ubuntu/services/saem2026/presenter-key.txt em 0600.
# Copiar deploy/nginx.conf para /home/ubuntu/services/saem2026/nginx.conf em 0644.
sudo -n docker stack deploy -c deploy/stack.yml saem2026
sudo -n docker service ps saem2026_web --no-trunc
```

Não copiar `.env` para o diretório público. Em deploys posteriores, repetir inspeção, `npm ci`, build e troca controlada de arquivos estáticos mantendo a versão anterior para rollback; conferir permissões 0755/0644 antes de servir, sem mexer na chave 0600. Rodar `sudo -n docker service update --force saem2026_web` quando mudar a config/reiniciar o container. Não reiniciar Traefik nem outros serviços.

## Verificação e DNS

- Antes de DNS, testar Traefik com resolução forçada: `curl --resolve saem2026.meetoliver.com.br:443:137.131.138.21 -k -I https://saem2026.meetoliver.com.br/`. `-k` é apenas para diagnóstico antes do certificado; não é prova de TLS válido.
- Após Gustavo criar o A `saem2026.meetoliver.com.br` → `137.131.138.21`, testar sem `-k`: `curl -I https://saem2026.meetoliver.com.br/`, `/palco`, `/notas`. O Let's Encrypt do Traefik depende de DNS público correto e porta 80 acessível; não chamar TLS de concluído antes disso.
- Confirmar `sudo -n docker service ps saem2026_web`, headers HTML e asset JS, console sem CSP bloqueando Supabase, palco autenticado, voto de celular real refletido no palco e resultados após reload.
- Se uma atualização falhar, restaurar o artefato estático anterior e reiniciar apenas `saem2026_web`; migrations exigem rollback separado/avaliação explícita. Nunca apagar respostas de produção como forma de rollback.

## Diagnóstico rápido

- `/status` (no navegador do palco) testa: build conectado ao Supabase, leitura de `live_state`, chave do apresentador salva e válida, leitura de respostas e canal Realtime.
- Sem chave válida o palco mostra alerta amarelo ("sem chave: plateia não sincroniza") e o slide de votação mostra "celulares fora de sincronia". Os celulares ficam em "Olhe para o palco" até o palco autenticar. Tecla **K** informa a chave sem precisar de link.
- Fontes são servidas pelo próprio site (`@fontsource`), compatível com `font-src 'self'` da CSP.

## Entrega para outros agentes

Trabalhar em branch, rodar `npm ci && npm run build`, enviar PR/commit e relatar a Hermes alterações de banco/deploy. Não considerar PR, merge ou Git push como publicação. Na solicitação de atualização, informar commit SHA e mudanças de migration; Hermes fará revisão, build, deploy e verificação. Não sobrescrever `app/.env.production.local` nem arquivos de runtime da VPS.
