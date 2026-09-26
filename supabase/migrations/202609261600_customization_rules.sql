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


create or replace function public.publish_shop_customization_rule(p_rule_id uuid)
returns public.shop_customization_rules
language plpgsql
security invoker
set search_path = public
as $$
declare
  target public.shop_customization_rules;
begin
  select *
    into target
    from public.shop_customization_rules
   where id = p_rule_id
   for update;

  if target.id is null then
    raise exception 'Customization rule not found';
  end if;

  perform 1
    from public.shop_customization_rules
   where product_id = target.product_id
   for update;

  update public.shop_customization_rules
     set status = 'archived',
         updated_at = now()
   where product_id = target.product_id
     and status = 'published'
     and id <> target.id;

  update public.shop_customization_rules
     set status = 'published',
         published_at = coalesce(published_at, now()),
         updated_at = now()
   where id = target.id
   returning * into target;

  return target;
end;
$$;

revoke all on function public.publish_shop_customization_rule(uuid)
  from public, anon, authenticated;
grant execute on function public.publish_shop_customization_rule(uuid)
  to service_role;
