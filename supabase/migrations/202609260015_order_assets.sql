-- Versioned order asset metadata.
-- Additive foundation for original, preview, proof and approved production assets.
-- Existing enquiry/proof files remain untouched; no storage object is moved by this migration.

begin;

create table if not exists public.shop_order_assets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders(id) on delete cascade,
  order_item_id uuid references public.shop_order_items(id) on delete cascade,
  asset_kind text not null
    check (asset_kind in ('original','preview','proof','production')),
  version_no integer not null check (version_no > 0),
  state text not null default 'draft'
    check (state in ('draft','ready','changes_requested','approved','superseded')),
  storage_bucket text not null,
  file_path text not null,
  file_name text,
  mime_type text,
  file_size bigint check (file_size is null or file_size > 0),
  sha256 text check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  source_asset_id uuid references public.shop_order_assets(id) on delete set null,
  proof_id uuid references public.shop_proofs(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(storage_bucket,file_path)
);

create unique index if not exists shop_order_assets_scope_version_uidx
  on public.shop_order_assets(
    order_id,
    coalesce(order_item_id,'00000000-0000-0000-0000-000000000000'::uuid),
    asset_kind,
    version_no
  );

create index if not exists shop_order_assets_order_idx
  on public.shop_order_assets(order_id,created_at desc);

create index if not exists shop_order_assets_item_idx
  on public.shop_order_assets(order_item_id,asset_kind,version_no desc)
  where order_item_id is not null;

alter table public.shop_order_assets enable row level security;
revoke all on public.shop_order_assets from anon, authenticated;
grant all on public.shop_order_assets to service_role;

commit;
