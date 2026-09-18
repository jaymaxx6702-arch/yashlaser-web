-- Run once in your Supabase project's SQL editor. No public read policies.
create table if not exists public.enquiries (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique,
 reference text not null unique default ('YL-' || upper(replace(gen_random_uuid()::text,'-',''))),
 customer_name text not null,
 phone text not null,
 email text,
 city text not null,
 phone_hash text not null,
 status text not null default 'new' check (status in ('new','contacted','mockup','approved','completed','cancelled')),
 consent_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create index if not exists enquiries_phone_time on public.enquiries(phone_hash,created_at);
create table if not exists public.enquiry_items (
 id uuid primary key default gen_random_uuid(),
 enquiry_id uuid not null references public.enquiries(id) on delete cascade,
 product_id text not null,
 product_name text not null,
 variant_id text,
 variant_name text,
 quantity integer not null check (quantity between 1 and 10000),
 unit_price_minor integer check (unit_price_minor>=0),
 currency text not null default 'INR',
 line1 text not null default '',
 line2 text not null default '',
 notes text not null default '',
 preview_fit text not null check (preview_fit in ('contain','cover')),
 artwork_path text
);
alter table public.enquiries enable row level security;
alter table public.enquiry_items enable row level security;
revoke all on public.enquiries,public.enquiry_items from anon,authenticated;
grant all on public.enquiries,public.enquiry_items to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('customer-artwork','customer-artwork',false,20971520,array['image/webp'])
on conflict(id) do update set public=false,file_size_limit=20971520,allowed_mime_types=array['image/webp'];
-- Intentionally no storage.objects policies for anonymous or authenticated users.
create or replace function public.submit_enquiry(payload jsonb) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare saved public.enquiries; artwork text;
begin
 perform pg_advisory_xact_lock(hashtextextended(payload->>'phone_hash',0));
 select * into saved from public.enquiries where request_id=(payload->>'request_id')::uuid;
 if found then
  select artwork_path into artwork from public.enquiry_items where enquiry_id=saved.id limit 1;
  return jsonb_build_object('reference',saved.reference,'artwork_path',artwork);
 end if;
 if (select count(*) from public.enquiries where phone_hash=payload->>'phone_hash' and created_at>now()-interval '10 minutes')>=5 then
  raise exception 'Enquiry limit reached';
 end if;
 insert into public.enquiries(request_id,customer_name,phone,email,city,phone_hash)
 values((payload->>'request_id')::uuid,payload->>'customer_name',payload->>'phone',payload->>'email',payload->>'city',payload->>'phone_hash') returning * into saved;
 insert into public.enquiry_items(enquiry_id,product_id,product_name,variant_id,variant_name,quantity,unit_price_minor,line1,line2,notes,preview_fit,artwork_path)
 values(saved.id,payload->>'product_id',payload->>'product_name',payload->>'variant_id',payload->>'variant_name',(payload->>'quantity')::integer,(payload->>'unit_price_minor')::integer,payload->>'line1',payload->>'line2',payload->>'notes',payload->>'fit',payload->>'artwork_path');
 return jsonb_build_object('reference',saved.reference,'artwork_path',payload->>'artwork_path');
end;
$$;
revoke all on function public.submit_enquiry(jsonb) from public,anon,authenticated;
grant execute on function public.submit_enquiry(jsonb) to service_role;
