-- Support ticket order linking and admin response workflow.
begin;

alter table if exists public.shop_support_tickets
  add column if not exists admin_response text,
  add column if not exists responded_at timestamptz;

create index if not exists shop_support_order_idx
  on public.shop_support_tickets(order_id)
  where order_id is not null;

commit;
