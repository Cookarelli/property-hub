begin;
alter table public.maintenance_requests drop constraint maintenance_requests_status_check;
alter table public.maintenance_requests add constraint maintenance_requests_status_check check(status in ('open','scheduled','in_progress','completed'));
alter table public.maintenance_requests add column pets_in_unit boolean not null default false;
alter table public.maintenance_requests add column pet_notes text not null default '' check(length(pet_notes)<=300);
alter table public.maintenance_requests add column preferred_access_date date;
alter table public.maintenance_requests add column preferred_access_time text not null default 'Contact me to arrange' check(length(preferred_access_time)<=100);
alter table public.maintenance_requests add column contact_preference text not null default 'Email' check(contact_preference in ('Email','Text message','Phone','Portal'));
alter table public.maintenance_requests add column scheduled_for timestamptz;
grant update(scheduled_for) on public.maintenance_requests to authenticated;
alter table public.maintenance_updates add column status text check(status in ('open','scheduled','in_progress','completed'));
alter table public.maintenance_updates add column scheduled_for timestamptz;
create index maintenance_updates_timeline_idx on public.maintenance_updates(organization_id,maintenance_request_id,created_at);
alter table public.maintenance_attachments drop constraint maintenance_attachments_mime_type_check;
alter table public.maintenance_attachments add constraint maintenance_attachments_mime_type_check check(mime_type in ('image/jpeg','image/png','image/webp','application/pdf','video/mp4','video/webm','video/quicktime'));
alter table public.maintenance_attachments drop constraint maintenance_attachments_size_bytes_check;
alter table public.maintenance_attachments add constraint maintenance_attachments_size_bytes_check check(size_bytes between 1 and 26214400);
alter table public.leases add column renewal_status text not null default 'not_started' check(renewal_status in ('not_started','eligible','requested','offered','renewed','not_renewing'));
alter table public.residents add column contact_preference text not null default 'Email' check(contact_preference in ('Email','Text message','Phone','Portal'));
alter table public.residents add column community_notifications boolean not null default true;
alter table public.residents add column maintenance_notifications boolean not null default true;
alter table public.residents add column payment_notifications boolean not null default true;
grant update(phone,contact_preference,community_notifications,maintenance_notifications,payment_notifications) on public.residents to authenticated;
create policy resident_contact_preferences on public.residents for update to authenticated
 using(private.is_resident(organization_id,id)) with check(private.is_resident(organization_id,id));
-- The client must not author status events that appear to come from management.
drop policy updates_insert on public.maintenance_updates;
create policy updates_insert on public.maintenance_updates for insert to authenticated with check(
 author_id=(select auth.uid()) and private.is_member(organization_id)
 and (status is null and scheduled_for is null or private.has_role(organization_id,array['owner','property_manager','maintenance']::public.app_role[]))
 and exists(select 1 from public.maintenance_requests r where r.organization_id=maintenance_updates.organization_id and r.id=maintenance_updates.maintenance_request_id)
);
-- Local/hosted private object buckets remain closed until authenticated storage
-- policies are provisioned. Demo uploads use IndexedDB, never an open bucket.
commit;
