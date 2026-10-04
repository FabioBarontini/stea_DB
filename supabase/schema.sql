-- Aurora II / Supabase schema
create table if not exists public.settori (
  codice_settore text primary key,
  settore text not null,
  livello_rad integer not null
);
create table if not exists public.unita_abitative (
  unita text primary key,
  tipo_unita text not null,
  capacita_unita integer not null
);
create table if not exists public.ruoli (
  codice_ruolo text primary key,
  ruolo text not null,
  descrizione_ruolo text not null
);
create table if not exists public.turni (
  turno text primary key,
  orario_turno text not null
);
create table if not exists public.persone (
  id integer primary key,
  cognome text not null,
  nome text not null,
  eta integer not null,
  codice_settore text not null references public.settori(codice_settore),
  unita text not null references public.unita_abitative(unita),
  codice_ruolo text not null references public.ruoli(codice_ruolo),
  turno text not null references public.turni(turno),
  indice_operativo integer not null
);
create index if not exists idx_persone_settore on public.persone(codice_settore);
create index if not exists idx_persone_unita on public.persone(unita);
create index if not exists idx_persone_ruolo on public.persone(codice_ruolo);
create index if not exists idx_persone_turno on public.persone(turno);
create index if not exists idx_persone_nome on public.persone(cognome, nome);

create or replace function public.execute_sql(query_text text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  q text := regexp_replace(btrim(query_text), ';[[:space:]]*$', '');
begin
  if q = '' then raise exception 'Query vuota'; end if;
  if q ~ ';' then raise exception 'Per sicurezza è consentita una sola istruzione SQL alla volta'; end if;
  if q !~* '^(select|with)' then raise exception 'Sono consentite solo query SELECT o WITH'; end if;
  if q ~* '(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|vacuum|analyze|refresh|comment|call|do)'
    then raise exception 'La query contiene un''operazione non consentita'; end if;
  execute format(
    'select coalesce(jsonb_agg(to_jsonb(qr)), ''[]''::jsonb) from (%s) qr', q
  ) into result;
  return result;
end;
$$;
grant execute on function public.execute_sql(text) to anon, authenticated;
