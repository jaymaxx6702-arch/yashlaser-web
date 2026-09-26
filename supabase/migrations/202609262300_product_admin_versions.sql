begin;

create table if not exists public.shop_product_admin_versions (
  id uuid primary key default gen_random_uuid(),
  product_key text not null
    check (product_key ~ '^[a-z0-9][a-z0-9-]{2,119}$'),
  base_product_id text,
  slug text not null
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and length(slug) <= 120),
  name text not null check (char_length(name) between 2 and 180),
  category_id text not null
    check (category_id in ('standees','awards','keychains','id-cards','name-plates','other')),
  subcategory_id text,
  revision integer not null check (revision between 1 and 100000),
  state text not null default 'draft'
    check (state in ('draft','published','archived')),
  product_payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(product_payload) = 'object'),
  customization_definition jsonb
    check (customization_definition is null or jsonb_typeof(customization_definition) = 'object'),
  validation_report jsonb not null default '{}'::jsonb
    check (jsonb_typeof(validation_report) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  published_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique(product_key, revision)
);

create unique index if not exists shop_product_admin_published_key_uidx
  on public.shop_product_admin_versions(product_key)
  where state='published';

create unique index if not exists shop_product_admin_published_slug_uidx
  on public.shop_product_admin_versions(lower(slug))
  where state='published';

create index if not exists shop_product_admin_state_updated_idx
  on public.shop_product_admin_versions(state, updated_at desc);

create index if not exists shop_product_admin_category_idx
  on public.shop_product_admin_versions(category_id, subcategory_id)
  where state <> 'archived';

create index if not exists shop_product_admin_created_by_idx
  on public.shop_product_admin_versions(created_by)
  where created_by is not null;

create index if not exists shop_product_admin_published_by_idx
  on public.shop_product_admin_versions(published_by)
  where published_by is not null;

alter table public.shop_product_admin_versions enable row level security;
revoke all on public.shop_product_admin_versions from anon, authenticated;
grant all on public.shop_product_admin_versions to service_role;

create or replace function public.publish_shop_product_admin_version(
  p_version_id uuid,
  p_admin_id uuid
)
returns public.shop_product_admin_versions
language plpgsql
security invoker
set search_path=public
as $$
declare
  target public.shop_product_admin_versions;
begin
  select * into target
  from public.shop_product_admin_versions
  where id=p_version_id
  for update;

  if target.id is null then
    raise exception 'Product admin version not found';
  end if;

  perform 1
  from public.shop_product_admin_versions
  where product_key=target.product_key
  for update;

  update public.shop_product_admin_versions
  set state='archived', updated_at=now()
  where product_key=target.product_key
    and state='published'
    and id<>target.id;

  update public.shop_product_admin_versions
  set state='published',
      published_by=p_admin_id,
      published_at=coalesce(published_at,now()),
      updated_at=now()
  where id=target.id
  returning * into target;

  return target;
end;
$$;

revoke all on function public.publish_shop_product_admin_version(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.publish_shop_product_admin_version(uuid,uuid)
  to service_role;

commit;
