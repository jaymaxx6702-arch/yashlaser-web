-- Yash Laser Shop: commerce/order foundation.
-- Safe to commit before rollout. Apply in Supabase before setting COMMERCE_ORDERS_ENABLED=true.

begin;

create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  order_no text not null unique default (
    'YL-' || to_char(now() at time zone 'Asia/Kolkata','YYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))
  ),
  access_token_hash text not null,
  customer_name text not null,
  customer_mobile text not null,
  customer_email text,
  shipping_address jsonb not null default '{}'::jsonb,
  status text not null default 'received'
    check (status in ('received','proof','production','packed','dispatched','delivered','cancelled')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','partial','paid','refunded','not_applicable')),
  currency text not null default 'INR',
  subtotal_minor bigint not null default 0 check (subtotal_minor >= 0),
  shipping_minor bigint not null default 0 check (shipping_minor >= 0),
  total_minor bigint not null default 0 check (total_minor >= 0),
  source text not null default 'website',
  yashflow_order_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_orders_token_idx on public.shop_orders(access_token_hash);
create index if not exists shop_orders_created_idx on public.shop_orders(created_at desc);

create table if not exists public.shop_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders(id) on delete cascade,
  product_id text not null,
  product_slug text not null,
  product_name text not null,
  variant_id text,
  variant_name text,
  quantity integer not null check (quantity between 1 and 10000),
  unit_price_minor bigint,
  line_total_minor bigint,
  pricing_mode text not null,
  design_id text,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists shop_order_items_order_idx on public.shop_order_items(order_id);

create table if not exists public.shop_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  note text,
  source text not null default 'shop',
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists shop_order_events_order_idx on public.shop_order_events(order_id,created_at);

create table if not exists public.shop_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders(id) on delete cascade,
  provider text not null,
  provider_reference text,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null default 'INR',
  status text not null default 'created'
    check (status in ('created','pending','paid','failed','refunded')),
  idempotency_key text not null unique,
  provider_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shop_payments_order_idx on public.shop_payments(order_id);

create table if not exists public.shop_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders(id) on delete cascade,
  version_no integer not null check (version_no > 0),
  status text not null default 'ready'
    check (status in ('draft','ready','changes_requested','approved','superseded')),
  file_path text not null,
  note text,
  access_token_hash text not null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique(order_id,version_no)
);
create index if not exists shop_proofs_token_idx on public.shop_proofs(access_token_hash);

create table if not exists public.shop_proof_actions (
  id uuid primary key default gen_random_uuid(),
  proof_id uuid not null references public.shop_proofs(id) on delete cascade,
  action text not null check (action in ('viewed','approved','changes_requested')),
  comment text,
  actor text not null default 'customer',
  created_at timestamptz not null default now()
);

create table if not exists public.shop_shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders(id) on delete cascade,
  courier text,
  awb text,
  tracking_url text,
  status text not null default 'preparing'
    check (status in ('preparing','awb_created','dispatched','in_transit','out_for_delivery','delivered','failed','rto')),
  package_count integer not null default 1 check (package_count > 0),
  dispatched_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shop_shipments_order_idx on public.shop_shipments(order_id);

create table if not exists public.shop_quotes (
  id uuid primary key default gen_random_uuid(),
  quote_no text not null unique default (
    'Q-' || to_char(now() at time zone 'Asia/Kolkata','YYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text,'-',''),1,7))
  ),
  access_token_hash text not null,
  customer_name text not null,
  customer_mobile text not null,
  customer_email text,
  source_type text not null default 'custom',
  status text not null default 'draft'
    check (status in ('draft','sent','accepted','expired','cancelled')),
  items jsonb not null default '[]'::jsonb,
  total_minor bigint,
  valid_until date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shop_quotes_token_idx on public.shop_quotes(access_token_hash);

create table if not exists public.shop_project_requests (
  id uuid primary key default gen_random_uuid(),
  request_no text not null unique default (
    'REQ-' || to_char(now() at time zone 'Asia/Kolkata','YYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text,'-',''),1,7))
  ),
  request_type text not null check (request_type in ('bulk','event','custom_acrylic')),
  customer_name text not null,
  customer_mobile text not null,
  customer_email text,
  status text not null default 'new'
    check (status in ('new','reviewing','quoted','accepted','closed','cancelled')),
  payload jsonb not null default '{}'::jsonb,
  quote_id uuid references public.shop_quotes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_no text not null unique default (
    'SUP-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,9))
  ),
  access_token_hash text not null,
  order_id uuid references public.shop_orders(id) on delete set null,
  customer_name text not null,
  customer_mobile text not null,
  customer_email text,
  category text not null default 'general',
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shop_support_token_idx on public.shop_support_tickets(access_token_hash);

create table if not exists public.shop_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.shop_orders(id) on delete set null,
  product_id text not null,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  review_text text not null,
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  verified_purchase boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.shop_integration_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  entity_id uuid,
  status text not null default 'pending' check (status in ('pending','success','failed','dead')),
  payload jsonb,
  error text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shop_orders enable row level security;
alter table public.shop_order_items enable row level security;
alter table public.shop_order_events enable row level security;
alter table public.shop_payments enable row level security;
alter table public.shop_proofs enable row level security;
alter table public.shop_proof_actions enable row level security;
alter table public.shop_shipments enable row level security;
alter table public.shop_quotes enable row level security;
alter table public.shop_project_requests enable row level security;
alter table public.shop_support_tickets enable row level security;
alter table public.shop_reviews enable row level security;
alter table public.shop_integration_events enable row level security;

revoke all on
  public.shop_orders,
  public.shop_order_items,
  public.shop_order_events,
  public.shop_payments,
  public.shop_proofs,
  public.shop_proof_actions,
  public.shop_shipments,
  public.shop_quotes,
  public.shop_project_requests,
  public.shop_support_tickets,
  public.shop_reviews,
  public.shop_integration_events
from anon, authenticated;

grant all on
  public.shop_orders,
  public.shop_order_items,
  public.shop_order_events,
  public.shop_payments,
  public.shop_proofs,
  public.shop_proof_actions,
  public.shop_shipments,
  public.shop_quotes,
  public.shop_project_requests,
  public.shop_support_tickets,
  public.shop_reviews,
  public.shop_integration_events
to service_role;

commit;
