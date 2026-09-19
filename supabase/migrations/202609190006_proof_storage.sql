-- Private proof storage + proof metadata.
begin;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'shop-proofs',
  'shop-proofs',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict(id) do update
set public=false,
    file_size_limit=10485760,
    allowed_mime_types=array['image/jpeg','image/png','image/webp','application/pdf'];

alter table if exists public.shop_proofs
  add column if not exists file_name text,
  add column if not exists mime_type text;

commit;
