begin;
alter table public.leads drop constraint leads_status_check;
update public.leads set status=case status when 'Tour scheduled' then 'Tour Scheduled' when 'Converted' then 'Leased' when 'Closed' then 'Lost' else status end;
alter table public.leads add constraint leads_status_check check(status in ('New','Contacted','Tour Scheduled','Applied','Approved','Leased','Lost'));
alter table public.leads add column phone text not null default '' check(length(phone)<=30);
alter table public.leads add column unit_id uuid;
alter table public.leads add column desired_move_in date;
alter table public.leads add foreign key(organization_id,property_id,unit_id) references public.units(organization_id,property_id,id);
create index leads_unit_idx on public.leads(organization_id,property_id,unit_id);
create index leads_pipeline_idx on public.leads(organization_id,status,created_at desc);
alter table public.applications alter column monthly_income_cents drop not null;
alter table public.applications add column phone text not null default '' check(length(phone)<=30);
alter table public.applications add column occupants integer not null default 1 check(occupants between 1 and 12);
alter table public.applications add column pets text not null default 'None' check(length(pets)<=100);
alter table public.announcements add column building_id uuid;
alter table public.announcements add constraint announcement_building_scope check(building_id is null or property_id is not null);
alter table public.announcements add foreign key(organization_id,property_id,building_id) references public.buildings(organization_id,property_id,id);
create index announcements_building_idx on public.announcements(organization_id,property_id,building_id);
drop policy community_announcements on public.announcements;
create policy community_announcements on public.announcements for select to authenticated using(
 published_at<=now() and private.is_member(organization_id) and (
 private.has_role(organization_id,array['maintenance']::public.app_role[])
 or (private.has_role(organization_id,array['resident']::public.app_role[]) and (property_id is null or private.lives_at(organization_id,property_id))
 and (building_id is null or exists(select 1 from public.units u where u.organization_id=announcements.organization_id and u.building_id=announcements.building_id and private.lives_at(u.organization_id,u.property_id,u.id))))));
alter table public.documents add column visibility text not null default 'staff' check(visibility in ('staff','community','assigned'));
update public.documents set visibility=case when resident_id is null then 'community' else 'assigned' end;
alter table public.documents add column building_id uuid;
alter table public.documents add constraint document_building_scope check(building_id is null or property_id is not null);
alter table public.documents add foreign key(organization_id,property_id,building_id) references public.buildings(organization_id,property_id,id);
create index documents_building_idx on public.documents(organization_id,property_id,building_id);
create table public.document_assignments (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), document_id uuid not null, resident_id uuid not null, assigned_by uuid not null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(organization_id,id),unique(organization_id,document_id,resident_id),
 foreign key(organization_id,document_id) references public.documents(organization_id,id),foreign key(organization_id,resident_id) references public.residents(organization_id,id),foreign key(organization_id,assigned_by) references public.organization_memberships(organization_id,user_id)
);
create index document_assignments_resident_idx on public.document_assignments(organization_id,resident_id);
create index document_assignments_author_idx on public.document_assignments(organization_id,assigned_by);
alter table public.document_assignments enable row level security;
revoke all on public.document_assignments from anon,authenticated;
grant select,insert,update,delete on public.document_assignments to authenticated;
create policy document_assignment_management on public.document_assignments for all to authenticated using(private.has_role(organization_id,array['owner','property_manager']::public.app_role[])) with check(private.has_role(organization_id,array['owner','property_manager']::public.app_role[]) and assigned_by=(select auth.uid()));
create policy document_assignment_resident on public.document_assignments for select to authenticated using(private.is_resident(organization_id,resident_id));
create trigger touch_record before update on public.document_assignments for each row execute function private.touch_record();
create function private.validate_document_assignment() returns trigger language plpgsql set search_path='' as $$
 begin
 if not exists(select 1 from public.documents d where d.id=new.document_id and d.organization_id=new.organization_id and d.visibility='assigned' and (d.property_id is null or exists(select 1 from public.lease_residents lr join public.leases l on l.organization_id=lr.organization_id and l.id=lr.lease_id join public.units u on u.organization_id=l.organization_id and u.id=l.unit_id where lr.organization_id=new.organization_id and lr.resident_id=new.resident_id and l.status='active' and u.property_id=d.property_id and (d.building_id is null or u.building_id=d.building_id)))) then raise exception 'Document assignment must match the resident community'; end if;
 return new;
 end;
$$;
revoke all on function private.validate_document_assignment() from public,anon,authenticated;
create trigger validate_document_assignment before insert or update on public.document_assignments for each row execute function private.validate_document_assignment();
drop policy resident_documents on public.documents;
create policy resident_documents on public.documents for select to authenticated using(
 private.has_role(organization_id,array['resident']::public.app_role[]) and (property_id is null or private.lives_at(organization_id,property_id))
 and (building_id is null or exists(select 1 from public.units u where u.organization_id=documents.organization_id and u.building_id=documents.building_id and private.lives_at(u.organization_id,u.property_id,u.id)))
 and (visibility='community' or (visibility='assigned' and (private.is_resident(organization_id,resident_id) or exists(select 1 from public.document_assignments a where a.organization_id=documents.organization_id and a.document_id=documents.id and private.is_resident(a.organization_id,a.resident_id))))));
create table public.maintenance_internal_notes (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),maintenance_request_id uuid not null,author_id uuid not null,body text not null check(length(body) between 1 and 2000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(organization_id,id),
 foreign key(organization_id,maintenance_request_id) references public.maintenance_requests(organization_id,id),foreign key(organization_id,author_id) references public.organization_memberships(organization_id,user_id)
);
create index maintenance_notes_request_idx on public.maintenance_internal_notes(organization_id,maintenance_request_id,created_at);
create index maintenance_notes_author_idx on public.maintenance_internal_notes(organization_id,author_id);
alter table public.maintenance_internal_notes enable row level security;
revoke all on public.maintenance_internal_notes from anon,authenticated;
grant select,insert on public.maintenance_internal_notes to authenticated;
create policy internal_notes_read on public.maintenance_internal_notes for select to authenticated using(private.has_role(organization_id,array['owner','property_manager','staff','maintenance']::public.app_role[]));
create policy internal_notes_insert on public.maintenance_internal_notes for insert to authenticated with check(author_id=(select auth.uid()) and private.has_role(organization_id,array['owner','property_manager','maintenance']::public.app_role[]) and exists(select 1 from public.maintenance_requests r where r.organization_id=maintenance_internal_notes.organization_id and r.id=maintenance_internal_notes.maintenance_request_id));
create trigger touch_record before update on public.maintenance_internal_notes for each row execute function private.touch_record();
alter table public.activity_events add column property_id uuid;
alter table public.activity_events add column related_id uuid;
alter table public.activity_events add foreign key(organization_id,property_id) references public.properties(organization_id,id);
create index activity_property_idx on public.activity_events(organization_id,property_id,created_at desc);
grant insert on public.activity_events to service_role;
create function private.record_leasing_activity() returns trigger language plpgsql set search_path='' as $$
 begin
 insert into public.activity_events(organization_id,property_id,related_id,event_type,title,description)
 values(new.organization_id,new.property_id,new.id,case new.kind when 'tour' then 'tour.requested' else 'application.inquiry' end,case new.kind when 'tour' then 'Tour requested' else 'Application inquiry received' end,'Public leasing website · Request saved');
 return new;
 end;
$$;
revoke all on function private.record_leasing_activity() from public,anon,authenticated;
create trigger leasing_activity after insert on public.leasing_intakes for each row execute function private.record_leasing_activity();
commit;
