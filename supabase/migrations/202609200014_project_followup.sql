-- Project request customer follow-up workflow.
begin;

alter table if exists public.shop_project_requests
  add column if not exists customer_message text,
  add column if not exists responded_at timestamptz;

commit;
