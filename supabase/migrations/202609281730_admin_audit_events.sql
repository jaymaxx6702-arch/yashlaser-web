begin;

create table if not exists public.shop_admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid,
  action text not null check (char_length(action) between 1 and 120),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id text,
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists shop_admin_audit_events_created_idx
  on public.shop_admin_audit_events(created_at desc);

create index if not exists shop_admin_audit_events_admin_idx
  on public.shop_admin_audit_events(admin_user_id, created_at desc)
  where admin_user_id is not null;

create index if not exists shop_admin_audit_events_entity_idx
  on public.shop_admin_audit_events(entity_type, entity_id, created_at desc)
  where entity_id is not null;

alter table public.shop_admin_audit_events enable row level security;

revoke all on public.shop_admin_audit_events
  from public, anon, authenticated;
grant all on public.shop_admin_audit_events to service_role;

commit;
