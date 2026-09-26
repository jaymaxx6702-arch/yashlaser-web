create table if not exists public.shop_customization_rules (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  revision integer not null check (revision > 0),
  status text not null check (status in ('draft', 'published', 'archived')),
  definition jsonb not null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz null,
  unique (product_id, revision)
);

create unique index if not exists shop_customization_rules_one_published
  on public.shop_customization_rules(product_id)
  where status = 'published';

create index if not exists shop_customization_rules_product_status
  on public.shop_customization_rules(product_id, status, revision desc);

alter table public.shop_customization_rules enable row level security;

revoke all on table public.shop_customization_rules from anon, authenticated;
grant all on table public.shop_customization_rules to service_role;
