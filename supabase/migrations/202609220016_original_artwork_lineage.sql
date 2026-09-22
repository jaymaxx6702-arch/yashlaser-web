-- Preserve original customer artwork when processed assets are used.
-- Apply after 202609220015_design_assets.sql.
begin;

alter table if exists public.enquiry_items
  add column if not exists source_artwork_path text;

create or replace function public.submit_enquiry(payload jsonb) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare
  saved public.enquiries;
  item public.enquiry_items;
begin
  perform pg_advisory_xact_lock(hashtextextended(payload->>'phone_hash',0));

  select * into saved
  from public.enquiries
  where request_id=(payload->>'request_id')::uuid;

  if found then
    select * into item
    from public.enquiry_items
    where enquiry_id=saved.id
    order by id
    limit 1;
    return jsonb_build_object(
      'reference',saved.reference,
      'enquiry_id',saved.id,
      'item_id',item.id,
      'artwork_path',item.artwork_path,
      'source_artwork_path',coalesce(item.source_artwork_path,item.artwork_path),
      'preview_path',item.preview_path
    );
  end if;

  if (
    select count(*)
    from public.enquiries
    where phone_hash=payload->>'phone_hash'
      and created_at>now()-interval '10 minutes'
  )>=5 then
    raise exception 'Enquiry limit reached';
  end if;

  insert into public.enquiries(
    request_id,customer_name,phone,email,city,phone_hash
  )
  values(
    (payload->>'request_id')::uuid,
    payload->>'customer_name',
    payload->>'phone',
    payload->>'email',
    payload->>'city',
    payload->>'phone_hash'
  )
  returning * into saved;

  insert into public.enquiry_items(
    enquiry_id,product_id,product_name,variant_id,variant_name,quantity,
    unit_price_minor,line1,line2,notes,preview_fit,artwork_path,
    source_artwork_path,preview_path,customization,design_id
  )
  values(
    saved.id,
    payload->>'product_id',
    payload->>'product_name',
    payload->>'variant_id',
    payload->>'variant_name',
    (payload->>'quantity')::integer,
    (payload->>'unit_price_minor')::integer,
    payload->>'line1',
    payload->>'line2',
    payload->>'notes',
    payload->>'fit',
    payload->>'artwork_path',
    coalesce(payload->>'source_artwork_path',payload->>'artwork_path'),
    payload->>'preview_path',
    payload->'customization',
    payload->>'design_id'
  )
  returning * into item;

  return jsonb_build_object(
    'reference',saved.reference,
    'enquiry_id',saved.id,
    'item_id',item.id,
    'artwork_path',item.artwork_path,
    'source_artwork_path',item.source_artwork_path,
    'preview_path',item.preview_path
  );
end;
$$;

revoke all on function public.submit_enquiry(jsonb)
  from public,anon,authenticated;
grant execute on function public.submit_enquiry(jsonb) to service_role;

commit;
