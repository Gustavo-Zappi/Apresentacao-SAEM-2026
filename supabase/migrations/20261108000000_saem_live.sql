-- SAEM 2026: estado ao vivo da apresentação + respostas da plateia.
-- Segurança: a plateia (anon) só lê o estado e só insere resposta na pergunta ABERTA.
-- Só o palco, com a chave do apresentador, muda o estado ou apaga respostas (via RPC).

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.config (
  key   text primary key,
  value text not null
);

-- Chave do apresentador (guardada como hash). TROQUE antes do evento:
--   update private.config set value = encode(extensions.digest('MINHA-CHAVE', 'sha256'), 'hex') where key = 'presenter_key_sha256';
insert into private.config (key, value)
values ('presenter_key_sha256', encode(extensions.digest('troque-esta-chave', 'sha256'), 'hex'))
on conflict (key) do nothing;

create table if not exists public.live_state (
  id          text primary key,
  question_id text,
  phase       text not null default 'idle' check (phase in ('idle', 'open', 'closed', 'reveal')),
  updated_at  timestamptz not null default now()
);

insert into public.live_state (id) values ('saem2026') on conflict (id) do nothing;

create table if not exists public.responses (
  id             uuid primary key default gen_random_uuid(),
  event_id       text not null default 'saem2026',
  question_id    text not null check (char_length(question_id) between 1 and 40),
  participant_id uuid not null,
  value          text not null check (char_length(value) between 1 and 40),
  created_at     timestamptz not null default now(),
  unique (question_id, participant_id)
);

create index if not exists responses_question_idx on public.responses (question_id);

alter table public.live_state enable row level security;
alter table public.responses  enable row level security;

-- Privilégios explícitos (mínimos)
revoke all on public.live_state, public.responses from anon, authenticated;
grant select on public.live_state to anon, authenticated;
grant select, insert on public.responses to anon, authenticated;

drop policy if exists "estado legivel" on public.live_state;
create policy "estado legivel" on public.live_state for select to anon, authenticated using (true);

drop policy if exists "respostas legiveis" on public.responses;
create policy "respostas legiveis" on public.responses for select to anon, authenticated using (true);

drop policy if exists "responde pergunta aberta" on public.responses;
create policy "responde pergunta aberta" on public.responses for insert to anon, authenticated
with check (
  event_id = 'saem2026'
  and exists (
    select 1 from public.live_state s
    where s.id = 'saem2026' and s.question_id = responses.question_id and s.phase = 'open'
  )
);

-- ---------------------------------------------------------------- RPCs do palco

create or replace function private.valid_key(p_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.config
    where key = 'presenter_key_sha256'
      and value = encode(extensions.digest(coalesce(p_key, ''), 'sha256'), 'hex')
  );
$$;

create or replace function public.check_presenter_key(p_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select private.valid_key(p_key); $$;

create or replace function public.set_live_state(p_key text, p_event text, p_question_id text, p_phase text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.valid_key(p_key) then
    return false;
  end if;
  update public.live_state
     set question_id = p_question_id, phase = p_phase, updated_at = now()
   where id = p_event;
  return found;
end;
$$;

create or replace function public.reset_question(p_key text, p_question_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.valid_key(p_key) then
    return false;
  end if;
  delete from public.responses where question_id = p_question_id;
  return true;
end;
$$;

revoke all on function public.check_presenter_key(text) from public;
revoke all on function public.set_live_state(text, text, text, text) from public;
revoke all on function public.reset_question(text, text) from public;
grant execute on function public.check_presenter_key(text) to anon, authenticated;
grant execute on function public.set_live_state(text, text, text, text) to anon, authenticated;
grant execute on function public.reset_question(text, text) to anon, authenticated;

-- private.valid_key é chamada só pelas RPCs (security definer)
revoke all on function private.valid_key(text) from public, anon, authenticated;

-- Realtime: o palco escuta INSERTs em responses (a plateia usa polling no live_state)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'responses'
  ) then
    alter publication supabase_realtime add table public.responses;
  end if;
end $$;

-- Resultado consolidado para análise pós-evento
create or replace view public.resultados with (security_invoker = true) as
select question_id, value, count(*)::int as votos
from public.responses
group by question_id, value
order by question_id, votos desc;
grant select on public.resultados to anon, authenticated;
