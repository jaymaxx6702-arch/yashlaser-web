-- YashFlow sync state on Shop orders.
begin;
alter table if exists public.shop_orders
  add column if not exists yashflow_sync_status text not null default 'not_synced'
    check (yashflow_sync_status in ('not_synced','pending','synced','failed')),
  add column if not exists yashflow_order_refs jsonb not null default '[]'::jsonb,
  add column if not exists yashflow_last_error text,
  add column if not exists yashflow_last_synced_at timestamptz;
commit;
