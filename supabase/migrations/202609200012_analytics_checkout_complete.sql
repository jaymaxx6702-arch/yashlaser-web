-- Extend first-party analytics with successful checkout completion.
begin;

alter table public.shop_analytics_events
  drop constraint if exists shop_analytics_events_event_name_check;

alter table public.shop_analytics_events
  add constraint shop_analytics_events_event_name_check
  check (
    event_name in (
      'page_view',
      'search',
      'product_view',
      'add_to_cart',
      'begin_checkout',
      'checkout_complete'
    )
  );

commit;
