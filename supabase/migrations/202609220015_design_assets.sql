-- Generic immutable design-asset lineage.
-- Additive only: existing enquiry artwork/preview paths and shop_proofs stay valid.
begin;

create table if not exists public.shop_design_assets (
  id uuid primary key default gen_random_uuid(),
  design_id text,
  owner_type text not null
    check (owner_type in ('enquiry','order','project','proof')),
  owner_id uuid not null,
  stage text not null
    check (stage in ('original','processed','preview','proof','production')),
  source_asset_id uuid references public.shop_design_assets(id) on delete restrict,
  storage_bucket text not null,
  file_path text not null,
  file_name text,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  processor text,
  approved_at timestamptz,
  locked boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(storage_bucket,file_path),
  check (
    (stage <> 'original' or source_asset_id is null)
    and
    (stage <> 'production' or (approved_at is not null and locked = true))
  )
);

create index if not exists shop_design_assets_owner_idx
  on public.shop_design_assets(owner_type,owner_id,created_at);
create index if not exists shop_design_assets_design_idx
  on public.shop_design_assets(design_id,created_at)
  where design_id is not null;
create index if not exists shop_design_assets_source_idx
  on public.shop_design_assets(source_asset_id)
  where source_asset_id is not null;

alter table public.shop_design_assets enable row level security;
revoke all on public.shop_design_assets from anon, authenticated;
grant all on public.shop_design_assets to service_role;

commit;
