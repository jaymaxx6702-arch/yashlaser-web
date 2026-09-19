-- Atomic, privacy-preserving rate limits keyed by server-side SHA-256 values.
begin;

create table if not exists public.shop_rate_limits (
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (scope,key_hash)
);

alter table public.shop_rate_limits enable row level security;
revoke all on public.shop_rate_limits from anon,authenticated;
grant all on public.shop_rate_limits to service_role;

create or replace function public.consume_shop_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  current_row public.shop_rate_limits%rowtype;
  now_value timestamptz := now();
begin
  if p_scope is null or p_key_hash is null or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_scope || ':' || p_key_hash, 0));

  select * into current_row
  from public.shop_rate_limits
  where scope=p_scope and key_hash=p_key_hash;

  if not found or current_row.window_started_at <= now_value - make_interval(secs => p_window_seconds) then
    insert into public.shop_rate_limits(scope,key_hash,window_started_at,request_count,updated_at)
    values(p_scope,p_key_hash,now_value,1,now_value)
    on conflict(scope,key_hash) do update
      set window_started_at=excluded.window_started_at,
          request_count=1,
          updated_at=excluded.updated_at;
    return true;
  end if;

  if current_row.request_count >= p_limit then
    return false;
  end if;

  update public.shop_rate_limits
  set request_count=request_count+1,updated_at=now_value
  where scope=p_scope and key_hash=p_key_hash;

  return true;
end;
$$;

revoke all on function public.consume_shop_rate_limit(text,text,integer,integer)
from public,anon,authenticated;
grant execute on function public.consume_shop_rate_limit(text,text,integer,integer)
to service_role;

commit;
