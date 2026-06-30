-- Setup completo da tabela leads para o projeto We_Expand_SDR
-- Rodar no SQL Editor do Supabase (dashboard do projeto novo)

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  company text,
  country text,
  city text,
  company_type text,
  linkedin_url text,
  website text,
  email text,
  phone text,
  source text not null default 'manual',
  raw_text text,
  hot_signals jsonb default '[]'::jsonb,
  score integer,
  outreach_message text,
  status text not null default 'novo',
  title_history jsonb not null default '[]'::jsonb,
  name_normalized text generated always as (lower(regexp_replace(trim(name), '\s+', ' ', 'g'))) stored,
  email_valid boolean,
  email_domain_has_mx boolean,
  phone_valid boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index leads_name_normalized_unique on public.leads using btree (name_normalized);
create unique index leads_linkedin_url_unique on public.leads using btree (linkedin_url) where (linkedin_url is not null);
create index leads_city_idx on public.leads using btree (city);
create index leads_status_idx on public.leads using btree (status);
create index leads_score_idx on public.leads using btree (score desc);

alter table public.leads enable row level security;
-- Sem políticas permissivas: só service_role acessa (RLS bloqueia anon/authenticated por padrão)

create or replace function public.upsert_lead(
  p_name text,
  p_title text default null,
  p_company text default null,
  p_country text default null,
  p_company_type text default null,
  p_linkedin_url text default null,
  p_website text default null,
  p_email text default null,
  p_phone text default null,
  p_source text default 'manual',
  p_raw_text text default null,
  p_hot_signals jsonb default '[]'::jsonb,
  p_score integer default null,
  p_outreach_message text default null,
  p_city text default null
)
returns leads
language plpgsql
set search_path to 'public'
as $function$
declare
  v_name_normalized text := lower(regexp_replace(trim(p_name), '\s+', ' ', 'g'));
  v_existing leads;
  v_result leads;
begin
  select * into v_existing from leads where name_normalized = v_name_normalized;

  if v_existing.id is null then
    insert into leads (name, title, company, country, city, company_type, linkedin_url, website, email, phone, source, raw_text, hot_signals, score, outreach_message)
    values (p_name, p_title, p_company, p_country, p_city, p_company_type, p_linkedin_url, p_website, p_email, p_phone, p_source, p_raw_text, p_hot_signals, p_score, p_outreach_message)
    returning * into v_result;
  else
    update leads set
      title = coalesce(p_title, title),
      company = coalesce(p_company, company),
      country = coalesce(p_country, country),
      city = coalesce(p_city, city),
      company_type = coalesce(p_company_type, company_type),
      linkedin_url = coalesce(p_linkedin_url, linkedin_url),
      website = coalesce(p_website, website),
      email = coalesce(p_email, email),
      phone = coalesce(p_phone, phone),
      hot_signals = case when p_hot_signals is not null and p_hot_signals != '[]'::jsonb then p_hot_signals else hot_signals end,
      score = coalesce(p_score, score),
      outreach_message = coalesce(p_outreach_message, outreach_message),
      title_history = case
        when p_title is not null and p_title is distinct from v_existing.title and v_existing.title is not null
        then v_existing.title_history || jsonb_build_object('title', v_existing.title, 'company', v_existing.company, 'observed_at', v_existing.updated_at)
        else v_existing.title_history
      end,
      source = p_source,
      updated_at = now()
    where id = v_existing.id
    returning * into v_result;
  end if;

  return v_result;
end;
$function$;
