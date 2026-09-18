begin;
alter table public.enquiries add column if not exists internal_notes text not null default '';
alter table public.enquiries drop constraint if exists enquiries_status_check;
update public.enquiries set status='mockup_pending' where status='mockup';
alter table public.enquiries add constraint enquiries_status_check check (
 status in ('new','contacted','mockup_pending','mockup_sent','approved','in_production','ready','dispatched','completed','cancelled')
);
-- No new public policies or grants. Admin access is checked on the server.
commit;
