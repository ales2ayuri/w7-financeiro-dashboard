-- W7 Creator dashboard: initial schema.
-- Sources (Google Sheets, Asana) are read-only. Everything here is history-preserving:
-- versions and decisions are append-only, enforced by triggers.

create extension if not exists pgcrypto;

-- Each synchronization run, per source.
create table sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('sheet', 'asana')),
  triggered_by text not null,               -- 'cron', 'manual:<email>'
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'ok', 'error')),
  records_read integer,
  records_new integer,
  records_changed integer,
  records_removed integer,
  error text,
  meta jsonb not null default '{}'::jsonb   -- sheet: header row and merges as read
);

-- One row per original record: sheet row ('row:<n>') or Asana task GID.
create table source_records (
  source text not null check (source in ('sheet', 'asana')),
  external_id text not null,
  current_hash text not null,
  current_payload jsonb not null,
  first_seen_run uuid not null references sync_runs (id),
  last_seen_run uuid not null references sync_runs (id),
  removed_at timestamptz,                   -- no longer in the source; never deleted here
  primary key (source, external_id)
);

-- Immutable copy of a record every time its content changes.
create table source_record_versions (
  id bigint generated always as identity primary key,
  source text not null,
  external_id text not null,
  sync_run_id uuid not null references sync_runs (id),
  hash text not null,
  payload jsonb not null,
  captured_at timestamptz not null default now(),
  foreign key (source, external_id) references source_records (source, external_id)
);
create index on source_record_versions (source, external_id, captured_at desc);

-- Asana activity (stories): when someone changed status, section, values or NF.
-- These dates are registration dates, treated as inferred, never as financial events.
create table asana_events (
  story_gid text primary key,
  task_gid text not null,
  created_at timestamptz not null,
  subtype text not null,
  field_name text,
  old_value text,
  new_value text,
  payload jsonb not null,
  sync_run_id uuid not null references sync_runs (id)
);
create index on asana_events (task_gid, created_at);

-- Manual decisions on alerts and reconciliation. Justification is mandatory.
create table decisions (
  id bigint generated always as identity primary key,
  subject_type text not null check (subject_type in ('alerta', 'conciliacao')),
  subject_key text not null,                -- e.g. 'row:212:comissao_zerada_ou_vazia', 'link:row:240+row:239|asana:123'
  action text not null,                     -- 'revisado', 'confirmar', 'desfazer', 'vincular', 'ignorar'
  justification text not null check (length(trim(justification)) > 0),
  data_origin text not null,                -- which source/version the decision was based on
  subject_hash text,                        -- record hash at decision time; a change reopens the item
  payload jsonb not null default '{}'::jsonb,
  decided_by text not null,
  decided_at timestamptz not null default now()
);
create index on decisions (subject_type, subject_key, decided_at desc);

-- Goals: commercial (K) and financial (M), monthly or yearly.
create table goals (
  kind text not null check (kind in ('comercial', 'financeira')),
  period text not null check (period in ('mes', 'ano')),
  year integer not null,
  month integer not null default 0 check (month between 0 and 12),  -- 0 for yearly goals
  target_cents bigint not null check (target_cents >= 0),
  updated_by text not null,
  updated_at timestamptz not null default now(),
  primary key (kind, period, year, month)
);

create table goal_history (
  id bigint generated always as identity primary key,
  kind text not null,
  period text not null,
  year integer not null,
  month integer not null,
  target_cents bigint,
  changed_by text not null,
  changed_at timestamptz not null default now()
);

-- Append-only enforcement.
create function forbid_change() returns trigger language plpgsql as $$
begin
  raise exception 'Tabela % é somente de inclusão: alterações e exclusões não são permitidas', tg_table_name;
end $$;

create trigger source_record_versions_append_only before update or delete on source_record_versions
  for each row execute function forbid_change();
create trigger asana_events_append_only before update or delete on asana_events
  for each row execute function forbid_change();
create trigger decisions_append_only before update or delete on decisions
  for each row execute function forbid_change();
create trigger goal_history_append_only before update or delete on goal_history
  for each row execute function forbid_change();

-- Every goal change is logged.
create function log_goal_change() returns trigger language plpgsql as $$
begin
  insert into goal_history (kind, period, year, month, target_cents, changed_by)
  values (new.kind, new.period, new.year, new.month, new.target_cents, new.updated_by);
  return new;
end $$;

create trigger goals_history after insert or update on goals
  for each row execute function log_goal_change();

-- No direct client access: the app reads and writes only on the server with the
-- service role, after checking the signed-in user against ALLOWED_EMAILS.
alter table sync_runs enable row level security;
alter table source_records enable row level security;
alter table source_record_versions enable row level security;
alter table asana_events enable row level security;
alter table decisions enable row level security;
alter table goals enable row level security;
alter table goal_history enable row level security;
