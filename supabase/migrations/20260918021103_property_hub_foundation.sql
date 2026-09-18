-- Property Hub foundation. Tenant scope is enforced by RLS AND composite foreign keys.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create type public.app_role as enum ('platform_admin','owner','property_manager','staff','maintenance','resident','applicant');
create table public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 100), slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- Identity is global. All organization access is granted separately through memberships.
create table public.users (
 id uuid primary key references auth.users(id) on delete cascade, full_name text not null, email text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.organization_memberships (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), user_id uuid not null references public.users(id), role public.app_role not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,user_id), unique(organization_id,id)
);
create index memberships_user_org_idx on public.organization_memberships(user_id,organization_id);
create table public.properties (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), name text not null, slug text not null, address text not null, city text not null, state text not null, zip text not null, description text not null default '', image text not null default '', neighborhood text not null default '', amenities text[] not null default '{}', published boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), unique(organization_id,slug)
);
create table public.buildings (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), property_id uuid not null, name text not null, floors integer not null check(floors > 0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), unique(organization_id,property_id,id), unique(organization_id,property_id,name), foreign key(organization_id,property_id) references public.properties(organization_id,id)
);
create table public.floor_plans (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), property_id uuid not null, name text not null, bedrooms integer not null check(bedrooms >= 0), bathrooms numeric(3,1) not null check(bathrooms > 0), sqft integer not null check(sqft > 0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), unique(organization_id,property_id,id), foreign key(organization_id,property_id) references public.properties(organization_id,id)
);
create table public.units (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), property_id uuid not null, building_id uuid not null, floor_plan_id uuid not null, number text not null, floor integer not null check(floor > 0), rent_cents integer not null check(rent_cents >= 0), status text not null check(status in ('occupied','available','turnover')), available_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), unique(organization_id,property_id,id), unique(organization_id,property_id,number),
 foreign key(organization_id,property_id) references public.properties(organization_id,id),
 foreign key(organization_id,property_id,building_id) references public.buildings(organization_id,property_id,id),
 foreign key(organization_id,property_id,floor_plan_id) references public.floor_plans(organization_id,property_id,id),
 check(status <> 'occupied' or available_on is null)
);
create index units_availability_idx on public.units(organization_id,property_id,status,available_on);
create index units_building_idx on public.units(organization_id,property_id,building_id);
create index units_plan_idx on public.units(organization_id,property_id,floor_plan_id);
create table public.residents (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), user_id uuid not null, name text not null, email text not null, phone text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), unique(organization_id,user_id), foreign key(organization_id,user_id) references public.organization_memberships(organization_id,user_id)
);
create table public.leases (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), unit_id uuid not null, starts_on date not null, ends_on date not null, rent_cents integer not null check(rent_cents >= 0), deposit_cents integer not null check(deposit_cents >= 0), status text not null check(status in ('draft','active','ended')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), foreign key(organization_id,unit_id) references public.units(organization_id,id), check(ends_on > starts_on)
);
create index leases_unit_idx on public.leases(organization_id,unit_id);
create index leases_expiration_idx on public.leases(organization_id,ends_on) where status='active';
create unique index one_active_lease_per_unit on public.leases(organization_id,unit_id) where status='active';
create table public.lease_residents (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), lease_id uuid not null, resident_id uuid not null, is_primary boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), unique(organization_id,lease_id,resident_id), foreign key(organization_id,lease_id) references public.leases(organization_id,id), foreign key(organization_id,resident_id) references public.residents(organization_id,id)
);
create unique index primary_lease_resident_idx on public.lease_residents(organization_id,lease_id) where is_primary;
create index lease_residents_resident_idx on public.lease_residents(organization_id,resident_id);
create table public.leads (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), property_id uuid not null, name text not null, email text not null, source text not null, status text not null check(status in ('New','Contacted','Tour scheduled','Converted','Closed')), interested_bedrooms integer not null check(interested_bedrooms >= 0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), foreign key(organization_id,property_id) references public.properties(organization_id,id)
);
create table public.applications (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), property_id uuid not null, unit_id uuid not null, user_id uuid not null, name text not null, email text not null, status text not null default 'draft' check(status in ('draft','submitted','in_review','approved','declined','withdrawn')), desired_move_in date not null, monthly_income_cents integer not null check(monthly_income_cents >= 0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), foreign key(organization_id,property_id) references public.properties(organization_id,id), foreign key(organization_id,property_id,unit_id) references public.units(organization_id,property_id,id), foreign key(organization_id,user_id) references public.organization_memberships(organization_id,user_id)
);
create index applications_owner_idx on public.applications(organization_id,user_id);
create index applications_queue_idx on public.applications(organization_id,status,created_at desc);
create table public.maintenance_requests (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), property_id uuid not null, unit_id uuid not null, resident_id uuid not null, assigned_to uuid, title text not null check(length(title) between 4 and 120), description text not null check(length(description) between 10 and 4000), category text not null, priority text not null default 'normal' check(priority in ('low','normal','high','urgent')), status text not null default 'open' check(status in ('open','in_progress','completed')), permission_to_enter boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), foreign key(organization_id,property_id) references public.properties(organization_id,id), foreign key(organization_id,property_id,unit_id) references public.units(organization_id,property_id,id), foreign key(organization_id,resident_id) references public.residents(organization_id,id), foreign key(organization_id,assigned_to) references public.organization_memberships(organization_id,user_id)
);
create index maintenance_queue_idx on public.maintenance_requests(organization_id,status,priority);
create index maintenance_assignee_idx on public.maintenance_requests(organization_id,assigned_to);
create index maintenance_resident_idx on public.maintenance_requests(organization_id,resident_id);
create table public.maintenance_attachments (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), maintenance_request_id uuid not null, uploaded_by uuid not null, storage_path text not null, mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp','application/pdf')), size_bytes integer not null check(size_bytes between 1 and 10485760),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), foreign key(organization_id,maintenance_request_id) references public.maintenance_requests(organization_id,id), foreign key(organization_id,uploaded_by) references public.organization_memberships(organization_id,user_id), check(storage_path like organization_id::text || '/%')
);
create table public.maintenance_updates (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), maintenance_request_id uuid not null, author_id uuid not null, body text not null check(length(body) between 1 and 4000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), foreign key(organization_id,maintenance_request_id) references public.maintenance_requests(organization_id,id), foreign key(organization_id,author_id) references public.organization_memberships(organization_id,user_id)
);
create table public.documents (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), property_id uuid, resident_id uuid, title text not null, category text not null, content text not null default '', storage_path text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), foreign key(organization_id,property_id) references public.properties(organization_id,id), foreign key(organization_id,resident_id) references public.residents(organization_id,id), check(storage_path is null or storage_path like organization_id::text || '/%')
);
create table public.announcements (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), property_id uuid, title text not null check(length(title) between 1 and 120), body text not null check(length(body) between 1 and 4000), category text not null default 'Community', published_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), foreign key(organization_id,property_id) references public.properties(organization_id,id)
);
create table public.payments (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), lease_id uuid not null, resident_id uuid not null, amount_cents integer not null check(amount_cents > 0), due_on date not null, paid_at timestamptz, status text not null check(status in ('paid','pending','overdue')), method text not null, simulated boolean not null default false, provider_event_id text unique,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), foreign key(organization_id,lease_id,resident_id) references public.lease_residents(organization_id,lease_id,resident_id), check((status='paid') = (paid_at is not null))
);
create index payments_resident_idx on public.payments(organization_id,resident_id);
create index payments_period_idx on public.payments(organization_id,due_on,status);
create table public.tour_requests (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), property_id uuid not null, unit_id uuid not null, user_id uuid not null, scheduled_at timestamptz not null, status text not null default 'requested' check(status in ('requested','confirmed','completed','cancelled')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), foreign key(organization_id,property_id) references public.properties(organization_id,id), foreign key(organization_id,property_id,unit_id) references public.units(organization_id,property_id,id), foreign key(organization_id,user_id) references public.organization_memberships(organization_id,user_id)
);
create index tours_user_idx on public.tour_requests(organization_id,user_id);
create table public.activity_events (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), actor_id uuid, event_type text not null, title text not null, description text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), foreign key(organization_id,actor_id) references public.organization_memberships(organization_id,user_id)
);
create index activity_recent_idx on public.activity_events(organization_id,created_at desc);
-- Lookup helpers intentionally bypass membership RLS, in an unexposed schema.
-- They only inspect the current authenticated identity; there is no impersonation argument.
create function private.has_role(org uuid, allowed public.app_role[]) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.organization_memberships m where m.organization_id=org and m.user_id=(select auth.uid()) and m.role=any(allowed));
$$;
create function private.is_member(org uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.organization_memberships m where m.organization_id=org and m.user_id=(select auth.uid()));
$$;
create function private.is_resident(org uuid, resident uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.residents r join public.organization_memberships m on m.organization_id=r.organization_id and m.user_id=r.user_id where r.organization_id=org and r.id=resident and r.user_id=(select auth.uid()));
$$;
create function private.lives_at(org uuid, property uuid, unit uuid default null) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.residents r join public.organization_memberships m on m.organization_id=r.organization_id and m.user_id=r.user_id join public.lease_residents lr on lr.organization_id=r.organization_id and lr.resident_id=r.id join public.leases l on l.organization_id=lr.organization_id and l.id=lr.lease_id join public.units u on u.organization_id=l.organization_id and u.id=l.unit_id where r.organization_id=org and r.user_id=(select auth.uid()) and l.status='active' and u.property_id=property and (unit is null or u.id=unit));
$$;
create function private.can_assign(org uuid, target_user uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and private.has_role(org,array['owner','property_manager','maintenance']::public.app_role[]) and exists(select 1 from public.organization_memberships m where m.organization_id=org and m.user_id=target_user and m.role in ('owner','property_manager','staff','maintenance'));
$$;
revoke all on all functions in schema private from public,anon;
grant execute on all functions in schema private to authenticated;
-- All tenant tables get RLS, immutable tenant IDs, timestamps, and supporting FK indexes.
create function private.touch_record() returns trigger language plpgsql set search_path='' as $$
 begin
 if tg_op='UPDATE' then
   if new.id <> old.id or new.created_at <> old.created_at then raise exception 'Record identity is immutable'; end if;
   if (to_jsonb(new)->>'organization_id') is distinct from (to_jsonb(old)->>'organization_id') then raise exception 'Tenant identity is immutable'; end if;
 end if;
 new.updated_at=now(); return new;
 end;
$$;
revoke all on function private.touch_record() from public,anon,authenticated;
do $$ declare t record; f record; begin
 for t in select tablename from pg_tables where schemaname='public' loop
  execute format('alter table public.%I enable row level security',t.tablename);
  execute format('create trigger touch_record before update on public.%I for each row execute function private.touch_record()',t.tablename);
 end loop;
 -- Index every FK's full referencing columns, including nullable ones.
 for f in select c.conrelid::regclass as tbl,c.conname,string_agg(quote_ident(a.attname),',' order by k.ord) as cols from pg_constraint c cross join lateral unnest(c.conkey) with ordinality k(attnum,ord) join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum where c.contype='f' and c.connamespace='public'::regnamespace group by c.conrelid,c.conname loop
  execute format('create index %I on %s (%s)',left(f.conname,54)||'_idx',f.tbl,f.cols);
 end loop;
end $$;
-- Prevent incomplete occupancy states at transaction commit. A lease and its residents can
-- be created atomically in any order, but cannot leave an occupied apartment unlinked.
create function private.check_occupancy() returns trigger language plpgsql security definer set search_path='' as $$
 declare org uuid; begin
 org=coalesce(new.organization_id,old.organization_id);
 if exists(select 1 from public.units u where u.organization_id=org and ((u.status='occupied') <> exists(select 1 from public.leases l where l.organization_id=u.organization_id and l.unit_id=u.id and l.status='active'))) then raise exception 'Occupied units require exactly one active lease; other units cannot have active leases'; end if;
 if exists(select 1 from public.leases l where l.organization_id=org and l.status='active' and not exists(select 1 from public.lease_residents lr where lr.organization_id=l.organization_id and lr.lease_id=l.id)) then raise exception 'Active leases require at least one resident'; end if;
 return null;
 end;
$$;
revoke all on function private.check_occupancy() from public,anon,authenticated;
create constraint trigger units_occupancy after insert or update or delete on public.units deferrable initially deferred for each row execute function private.check_occupancy();
create constraint trigger leases_occupancy after insert or update or delete on public.leases deferrable initially deferred for each row execute function private.check_occupancy();
create constraint trigger lease_residents_occupancy after insert or update or delete on public.lease_residents deferrable initially deferred for each row execute function private.check_occupancy();
-- Explicit grants: membership provisioning and financial writes require a trusted backend.
revoke all on all tables in schema public from anon,authenticated;
grant select on all tables in schema public to authenticated;
grant update(name) on public.organizations to authenticated;
grant update(full_name) on public.users to authenticated;
grant insert,update,delete on public.properties,public.buildings,public.floor_plans,public.units,public.residents,public.leases,public.lease_residents,public.leads,public.documents,public.announcements to authenticated;
grant insert,update on public.applications,public.tour_requests to authenticated;
grant insert on public.maintenance_requests,public.maintenance_updates,public.maintenance_attachments to authenticated;
grant update(status,assigned_to) on public.maintenance_requests to authenticated;
create policy own_identity on public.users for select to authenticated using(id=(select auth.uid()));
create policy edit_own_name on public.users for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy own_memberships on public.organization_memberships for select to authenticated using(user_id=(select auth.uid()));
create policy member_organization on public.organizations for select to authenticated using(private.is_member(id));
create policy owner_organization on public.organizations for update to authenticated using(private.has_role(id,array['owner']::public.app_role[])) with check(private.has_role(id,array['owner']::public.app_role[]));
-- platform_admin is a provisionable scoped role, never an implicit cross-tenant bypass.
do $$ declare name text; begin
 foreach name in array array['properties','buildings','floor_plans','units','residents','leases','lease_residents','leads','applications','maintenance_requests','maintenance_attachments','maintenance_updates','documents','announcements','tour_requests','activity_events'] loop
  execute format('create policy operations_read on public.%I for select to authenticated using(private.has_role(organization_id,array[''owner'',''property_manager'',''staff'']::public.app_role[]))',name);
 end loop;
 foreach name in array array['properties','buildings','floor_plans','units','residents','leases','lease_residents','leads','documents','announcements'] loop
  execute format('create policy management_write on public.%I for all to authenticated using(private.has_role(organization_id,array[''owner'',''property_manager'']::public.app_role[])) with check(private.has_role(organization_id,array[''owner'',''property_manager'']::public.app_role[]))',name);
 end loop;
 foreach name in array array['properties','buildings','floor_plans','units'] loop
  execute format('create policy maintenance_inventory on public.%I for select to authenticated using(private.has_role(organization_id,array[''maintenance'']::public.app_role[]))',name);
 end loop;
end $$;
create policy self_resident on public.residents for select to authenticated using(private.is_resident(organization_id,id));
create policy resident_lease_links on public.lease_residents for select to authenticated using(private.is_resident(organization_id,resident_id));
create policy resident_leases on public.leases for select to authenticated using(exists(select 1 from public.lease_residents lr where lr.organization_id=leases.organization_id and lr.lease_id=leases.id and private.is_resident(lr.organization_id,lr.resident_id)));
create policy resident_units on public.units for select to authenticated using(private.lives_at(organization_id,property_id,id));
create policy resident_property on public.properties for select to authenticated using(private.lives_at(organization_id,id));
create policy member_published_properties on public.properties for select to authenticated using(published and private.has_role(organization_id,array['applicant']::public.app_role[]));
create policy applicant_availability on public.units for select to authenticated using(status='available' and private.has_role(organization_id,array['applicant']::public.app_role[]) and exists(select 1 from public.properties p where p.organization_id=units.organization_id and p.id=units.property_id and p.published));
create policy visible_floor_plans on public.floor_plans for select to authenticated using(private.lives_at(organization_id,property_id) or (private.has_role(organization_id,array['applicant']::public.app_role[]) and exists(select 1 from public.properties p where p.organization_id=floor_plans.organization_id and p.id=floor_plans.property_id and p.published)));
create policy own_applications on public.applications for select to authenticated using(user_id=(select auth.uid()) and private.is_member(organization_id));
create policy applicant_insert on public.applications for insert to authenticated with check(user_id=(select auth.uid()) and status in ('draft','submitted') and private.has_role(organization_id,array['applicant']::public.app_role[]) and exists(select 1 from public.units u where u.organization_id=applications.organization_id and u.id=applications.unit_id and u.status='available'));
create policy applicant_update on public.applications for update to authenticated using(user_id=(select auth.uid()) and status='draft' and private.has_role(organization_id,array['applicant']::public.app_role[])) with check(user_id=(select auth.uid()) and status in ('draft','submitted') and private.has_role(organization_id,array['applicant']::public.app_role[]));
create policy management_applications on public.applications for update to authenticated using(private.has_role(organization_id,array['owner','property_manager']::public.app_role[])) with check(private.has_role(organization_id,array['owner','property_manager']::public.app_role[]));
create policy maintenance_read on public.maintenance_requests for select to authenticated using(private.has_role(organization_id,array['maintenance']::public.app_role[]) or private.is_resident(organization_id,resident_id));
create policy request_insert on public.maintenance_requests for insert to authenticated with check(private.has_role(organization_id,array['owner','property_manager']::public.app_role[]) or (private.is_resident(organization_id,resident_id) and private.lives_at(organization_id,property_id,unit_id) and status='open' and assigned_to is null));
create policy request_work on public.maintenance_requests for update to authenticated using(private.has_role(organization_id,array['owner','property_manager','maintenance']::public.app_role[])) with check(private.has_role(organization_id,array['owner','property_manager','maintenance']::public.app_role[]) and (assigned_to is null or private.can_assign(organization_id,assigned_to)));
create policy updates_read on public.maintenance_updates for select to authenticated using(exists(select 1 from public.maintenance_requests r where r.organization_id=maintenance_updates.organization_id and r.id=maintenance_updates.maintenance_request_id));
create policy updates_insert on public.maintenance_updates for insert to authenticated with check(author_id=(select auth.uid()) and private.is_member(organization_id) and exists(select 1 from public.maintenance_requests r where r.organization_id=maintenance_updates.organization_id and r.id=maintenance_updates.maintenance_request_id));
create policy attachments_read on public.maintenance_attachments for select to authenticated using(exists(select 1 from public.maintenance_requests r where r.organization_id=maintenance_attachments.organization_id and r.id=maintenance_attachments.maintenance_request_id));
create policy attachments_insert on public.maintenance_attachments for insert to authenticated with check(uploaded_by=(select auth.uid()) and private.is_member(organization_id) and exists(select 1 from public.maintenance_requests r where r.organization_id=maintenance_attachments.organization_id and r.id=maintenance_attachments.maintenance_request_id));
create policy resident_documents on public.documents for select to authenticated using(private.is_member(organization_id) and ((resident_id is not null and private.is_resident(organization_id,resident_id)) or (resident_id is null and private.has_role(organization_id,array['resident']::public.app_role[]) and (property_id is null or private.lives_at(organization_id,property_id)))));
create policy community_announcements on public.announcements for select to authenticated using(published_at <= now() and private.is_member(organization_id) and (private.has_role(organization_id,array['maintenance']::public.app_role[]) or (private.has_role(organization_id,array['resident']::public.app_role[]) and (property_id is null or private.lives_at(organization_id,property_id)))));
create policy finance_read on public.payments for select to authenticated using(private.has_role(organization_id,array['owner','property_manager']::public.app_role[]) or private.is_resident(organization_id,resident_id));
create policy own_tours on public.tour_requests for select to authenticated using(user_id=(select auth.uid()) and private.is_member(organization_id));
create policy request_tour on public.tour_requests for insert to authenticated with check(user_id=(select auth.uid()) and status='requested' and private.has_role(organization_id,array['applicant']::public.app_role[]) and exists(select 1 from public.units u where u.organization_id=tour_requests.organization_id and u.id=tour_requests.unit_id and u.status='available'));
create policy edit_tour on public.tour_requests for update to authenticated using(user_id=(select auth.uid()) and status in ('requested','confirmed') and private.has_role(organization_id,array['applicant']::public.app_role[])) with check(user_id=(select auth.uid()) and status in ('requested','cancelled') and private.has_role(organization_id,array['applicant']::public.app_role[]));
create policy management_tours on public.tour_requests for update to authenticated using(private.has_role(organization_id,array['owner','property_manager']::public.app_role[])) with check(private.has_role(organization_id,array['owner','property_manager']::public.app_role[]));
-- Storage bucket setup intentionally ships separately from relational schema.
-- No anonymous table grants, no demo JWT, no service-role client, no metadata-based roles.
commit;
