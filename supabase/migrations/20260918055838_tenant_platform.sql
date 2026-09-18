begin;
-- Existing organization IDs and every owned record are preserved.
alter table public.organizations
 add column legal_name text check(length(legal_name)<=160),
 add column phone text check(length(phone)<=40),
 add column email text check(length(email)<=254),
 add column website text check(website is null or website ~ '^https://[^[:space:]]+$'),
 add column logo_url text check(logo_url is null or logo_url ~ '^https://[^[:space:]]+$' or logo_url ~ '^/[^/][^[:space:]]*$'),
 add column primary_color text not null default '#284f40' check(primary_color ~ '^#[0-9a-fA-F]{6}$'),
 add column secondary_color text not null default '#edf2ed' check(secondary_color ~ '^#[0-9a-fA-F]{6}$'),
 add column address text check(length(address)<=500),
 add column status text not null default 'active' check(status in ('active','inactive')),
 add column subscription_status text not null default 'trial' check(subscription_status in ('trial','active','past_due','cancelled'));
update public.organizations set legal_name=name,phone='(512) 555-0142',email='hello@alderandstone.example',address='1840 Mercer Avenue, Austin, TX 78704'
 where id='00000001-0000-4000-8000-000000000001' and slug='alder-stone';
create index organizations_status_idx on public.organizations(status,created_at desc);

-- Platform privileges are separate from organization roles. No legacy scoped
-- platform_admin membership is promoted, and no demo super-admin is seeded.
create table public.platform_memberships (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.users(id),
 role text not null default 'super_admin' check(role='super_admin'),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.platform_configuration (
 id uuid primary key default gen_random_uuid(), key text not null unique check(key ~ '^[a-z][a-z0-9_]{1,79}$'),
 value jsonb not null default '{}' check(jsonb_typeof(value)='object'),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.organization_settings (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null unique references public.organizations(id),
 timezone text not null default 'America/Chicago',
 settings jsonb not null default '{}' check(jsonb_typeof(settings)='object'),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
insert into public.organization_settings(organization_id) select id from public.organizations on conflict(organization_id) do nothing;
create table public.organization_domains (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),
 hostname text not null unique check(hostname=lower(hostname) and length(hostname)<=253 and hostname ~ '^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$'),
 verified_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index organization_domains_org_idx on public.organization_domains(organization_id);
do $$ declare t text; begin
 foreach t in array array['platform_memberships','platform_configuration','organization_settings','organization_domains'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('grant all on public.%I to service_role',t);
  execute format('create trigger touch_record before update on public.%I for each row execute function private.touch_record()',t);
 end loop;
end $$;
create function private.is_super_admin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.platform_memberships p where p.user_id=(select auth.uid()) and p.role='super_admin');
$$;
create function private.organization_active(org uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.organizations o where o.id=org and o.status='active');
$$;
create or replace function private.has_role(org uuid, allowed public.app_role[]) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.organization_memberships m join public.organizations o on o.id=m.organization_id where m.organization_id=org and o.status='active' and m.user_id=(select auth.uid()) and (m.role=any(allowed) or (m.role='admin' and allowed && array['owner','property_manager']::public.app_role[])));
$$;
create or replace function private.is_member(org uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.organization_memberships m join public.organizations o on o.id=m.organization_id where m.organization_id=org and o.status='active' and m.user_id=(select auth.uid()));
$$;
create or replace function private.can_assign(org uuid,target_user uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and private.has_role(org,array['owner','property_manager','maintenance']::public.app_role[]) and exists(select 1 from public.organization_memberships m where m.organization_id=org and m.user_id=target_user and m.role in ('owner','admin','property_manager','staff','maintenance'));
$$;
revoke all on function private.is_super_admin(),private.organization_active(uuid) from public,anon;
grant execute on function private.is_super_admin(),private.organization_active(uuid) to authenticated;
create policy platform_own_membership on public.platform_memberships for select to authenticated using(user_id=(select auth.uid()));
create policy platform_organizations_read on public.organizations for select to authenticated using((select private.is_super_admin()));
create policy platform_organizations_create on public.organizations for insert to authenticated with check((select private.is_super_admin()));
create policy platform_organizations_update on public.organizations for update to authenticated using((select private.is_super_admin())) with check((select private.is_super_admin()));
grant insert on public.organizations to authenticated;
grant update(legal_name,phone,email,website,logo_url,primary_color,secondary_color,address,status,subscription_status) on public.organizations to authenticated;
create function private.guard_platform_organization_fields() returns trigger language plpgsql set search_path='' as $$
 begin
 if current_user='authenticated' and not private.is_super_admin() and
 (new.status is distinct from old.status or new.subscription_status is distinct from old.subscription_status)
 then raise exception 'Only platform administrators may change organization lifecycle or subscription state'; end if;
 return new;
 end;
$$;
revoke all on function private.guard_platform_organization_fields() from public,anon,authenticated;
create trigger guard_platform_fields before update on public.organizations for each row execute function private.guard_platform_organization_fields();
grant insert,update,delete on public.platform_configuration to authenticated;
create policy super_admin_configuration on public.platform_configuration for all to authenticated using((select private.is_super_admin())) with check((select private.is_super_admin()));
grant insert,update on public.organization_settings to authenticated;
create policy member_settings_read on public.organization_settings for select to authenticated using(private.is_member(organization_id));
create policy admin_settings_write on public.organization_settings for all to authenticated using(private.has_role(organization_id,array['owner','admin']::public.app_role[])) with check(private.has_role(organization_id,array['owner','admin']::public.app_role[]));
grant insert,update,delete on public.organization_domains to authenticated;
create policy platform_domains on public.organization_domains for all to authenticated using((select private.is_super_admin())) with check((select private.is_super_admin()));
create policy member_domains_read on public.organization_domains for select to authenticated using(private.is_member(organization_id));
create policy admin_member_directory on public.organization_memberships for select to authenticated using(private.has_role(organization_id,array['owner','property_manager']::public.app_role[]));

-- Profile visibility requires a shared active organization and administrative access.
create function private.can_read_colleague(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.organization_memberships m where m.user_id=target and private.has_role(m.organization_id,array['owner','property_manager']::public.app_role[]));
$$;
revoke all on function private.can_read_colleague(uuid) from public,anon;
grant execute on function private.can_read_colleague(uuid) to authenticated;
create policy colleague_profiles on public.users for select to authenticated using(private.can_read_colleague(id));

-- Compatible name for integrations; security_invoker preserves base-table RLS.
create view public.organization_members with (security_invoker=true) as select id,organization_id,user_id,role,created_at,updated_at from public.organization_memberships;
revoke all on public.organization_members from public,anon,authenticated;
grant select on public.organization_members to authenticated;

-- Leasing is a scoped operational role, with no financial, resident-directory,
-- membership, private-maintenance-note, or platform permissions.
do $$ declare t text; begin
 foreach t in array array['properties','buildings','units','floor_plans','leads','applications','tour_requests','leasing_intakes','documents','announcements'] loop
  execute format('create policy leasing_read on public.%I for select to authenticated using(private.has_role(organization_id,array[''leasing'']::public.app_role[]))',t);
 end loop;
 foreach t in array array['leads','applications','tour_requests'] loop
  execute format('create policy leasing_update on public.%I for update to authenticated using(private.has_role(organization_id,array[''leasing'']::public.app_role[])) with check(private.has_role(organization_id,array[''leasing'']::public.app_role[]))',t);
 end loop;
end $$;
create policy leasing_lead_insert on public.leads for insert to authenticated with check(private.has_role(organization_id,array['leasing']::public.app_role[]));

-- Deactivation applies even to policies that authorize residents via leases.
-- Platform metadata/domain tables deliberately remain usable for reactivation.
do $$ declare t record; begin
 for t in select c.table_name from information_schema.columns c join information_schema.tables catalog_tables using(table_schema,table_name) where c.table_schema='public' and c.column_name='organization_id' and catalog_tables.table_type='BASE TABLE' and c.table_name not in ('organization_domains','organization_memberships') loop
  execute format('create policy active_organization on public.%I as restrictive for all to authenticated using(private.organization_active(organization_id)) with check(private.organization_active(organization_id))',t.table_name);
 end loop;
end $$;
comment on view public.organization_members is 'Compatibility name for organization_memberships. RLS is evaluated as the caller; provisioning remains a trusted operation.';
comment on table public.platform_memberships is 'Platform-level super_admin only. Bootstrap with a trusted migration or service credential; never derive this role from demo state or user metadata.';
commit;
