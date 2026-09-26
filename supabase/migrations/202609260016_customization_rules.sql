-- Yash Laser Shop: versioned admin-managed customization rules.
-- Additive foundation only. Applying this migration does not change storefront behavior
-- until a published-rule loader is explicitly wired into customer customization pages.

begin;

create table if not exists public.shop_customization_rules (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  category_id text not null
    check (category_id in ('standees','awards','keychains','id-cards','name-plates','other')),
  contract_version integer not null default 1 check (contract_version = 1),
  revision integer not null check (revision > 0),
  status text not null default 'draft'
    check (status in ('draft','published','archived')),
  definition jsonb not null,
  created_by uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique(product_id, revision)
);

create index if not exists shop_customization_rules_product_idx
  on public.shop_customization_rules(product_id, revision desc);

create index if not exists shop_customization_rules_status_idx
  on public.shop_customization_rules(status, created_at desc);

create unique index if not exists shop_customization_rules_one_published_uidx
  on public.shop_customization_rules(product_id)
  where status = 'published';

alter table public.shop_customization_rules enable row level security;
revoke all on public.shop_customization_rules from anon, authenticated;
grant all on public.shop_customization_rules to service_role;

create or replace function public.write_shop_customization_rule(
  p_product_id text,
  p_category_id text,
  p_definition jsonb,
  p_status text,
  p_created_by uuid default null
)
returns public.shop_customization_rules
language plpgsql
security definer
set search_path = public
as $$
declare
  v_revision integer;
  v_row public.shop_customization_rules;
begin
  if p_product_id is null or length(trim(p_product_id)) = 0 then
    raise exception 'product id is required';
  end if;

  if p_category_id not in (
    'standees','awards','keychains','id-cards','name-plates','other'
  ) then
    raise exception 'invalid customization category';
  end if;

  if p_status not in ('draft','published') then
    raise exception 'invalid customization rule status';
  end if;

  if p_definition is null or jsonb_typeof(p_definition) <> 'object' then
    raise exception 'customization definition must be an object';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_product_id, 0));

  select coalesce(max(revision), 0) + 1
    into v_revision
    from public.shop_customization_rules
   where product_id = p_product_id;

  if p_status = 'published' then
    update public.shop_customization_rules
       set status = 'archived'
     where product_id = p_product_id
       and status = 'published';
  end if;

  insert into public.shop_customization_rules (
    product_id,
    category_id,
    contract_version,
    revision,
    status,
    definition,
    created_by,
    published_at
  )
  values (
    p_product_id,
    p_category_id,
    1,
    v_revision,
    p_status,
    p_definition,
    p_created_by,
    case when p_status = 'published' then now() else null end
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.write_shop_customization_rule(text,text,jsonb,text,uuid)
  from public, anon, authenticated;
grant execute on function public.write_shop_customization_rule(text,text,jsonb,text,uuid)
  to service_role;

commit;
