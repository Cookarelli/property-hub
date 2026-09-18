begin;
-- Preserve legacy recipients in the assignment table, with no invented author.
alter table public.document_assignments alter column assigned_by drop not null;
alter table public.document_assignments disable trigger validate_document_assignment;
insert into public.document_assignments(organization_id,document_id,resident_id,assigned_by)
select organization_id,id,resident_id,null from public.documents where resident_id is not null
on conflict(organization_id,document_id,resident_id) do nothing;
alter table public.document_assignments enable trigger validate_document_assignment;
update public.documents set resident_id=null where resident_id is not null;
-- All new and legacy recipient access now has a single, revocable source.
alter table public.documents add constraint document_recipients_use_assignments check(resident_id is null);
drop policy resident_documents on public.documents;
create policy resident_documents on public.documents for select to authenticated using(
 private.has_role(organization_id,array['resident']::public.app_role[])
 and (property_id is null or private.lives_at(organization_id,property_id))
 and (building_id is null or exists(select 1 from public.units u where u.organization_id=documents.organization_id and u.building_id=documents.building_id and private.lives_at(u.organization_id,u.property_id,u.id)))
 and (visibility='community' or (visibility='assigned' and exists(select 1 from public.document_assignments a where a.organization_id=documents.organization_id and a.document_id=documents.id and private.is_resident(a.organization_id,a.resident_id)))));
commit;
