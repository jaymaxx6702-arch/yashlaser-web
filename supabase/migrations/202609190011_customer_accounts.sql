-- Customer-account association for Shop orders.
begin;

alter table if exists public.shop_orders
  add column if not exists customer_user_id uuid references auth.users(id) on delete set null;

create index if not exists shop_orders_customer_user_idx
  on public.shop_orders(customer_user_id,created_at desc);

commit;
