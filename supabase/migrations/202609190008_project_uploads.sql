-- Project-request secure uploads.
begin;

alter table if exists public.shop_project_requests
  add column if not exists access_token_hash text;

create table if not exists public.shop_project_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.shop_project_requests(id) on delete cascade,
  file_path text not null unique,
  file_name text not null,
  mime_type text not null,
  file_size bigint,
  created_at timestamptz not null default now()
);
create index if not exists shop_project_files_request_idx on public.shop_project_files(request_id);
alter table public.shop_project_files enable row level security;
revoke all on public.shop_project_files from anon, authenticated;
grant all on public.shop_project_files to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'customer-documents',
  'customer-documents',
  false,
  20971520,
  array[
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict(id) do update
set public=false,
    file_size_limit=20971520,
    allowed_mime_types=array[
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

commit;
