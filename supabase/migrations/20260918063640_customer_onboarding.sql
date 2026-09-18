begin;
-- Extend existing records without replacing tenant identities or business data.
alter table public.organizations drop constraint organizations_status_check;
update public.organizations set status='suspended' where status='inactive';
alter table public.organizations add constraint organizations_status_check check(status in ('draft','setup','ready','active','suspended'));
alter table public.organizations alter column status set default 'draft';
alter table public.organizations drop constraint organizations_subscription_status_check;
update public.organizations set subscription_status='canceled' where subscription_status='cancelled';
alter table public.organizations add constraint organizations_subscription_status_check check(subscription_status in ('trial','active','past_due','canceled'));
create function private.plan_features(plan text) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('website',true,'property_listings',true,'availability',true,'lead_capture',true,'resident_portal',plan<>'starter','maintenance_requests',plan<>'starter','maintenance_tracking',plan<>'starter','documents',plan<>'starter','announcements',plan<>'starter','resident_messaging',false,'online_applications',false,'lease_management',plan<>'starter','payment_integration',false,'sms_notifications',false,'analytics',false);
$$;
create function private.valid_features(flags jsonb) returns boolean language sql immutable set search_path='' as $$
 select jsonb_typeof(flags)='object' and not exists(select 1 from jsonb_each(flags) e where jsonb_typeof(e.value)<>'boolean' or not private.plan_features('portfolio') ? e.key);
$$;
alter table public.organizations
 add column plan text not null default 'portfolio' check(plan in ('starter','professional','portfolio')),
 add column features jsonb not null default private.plan_features('portfolio') check(private.valid_features(features)),
 add column portal_configured_at timestamptz,
 add column maintenance_configured_at timestamptz,
 add column payments_deferred_at timestamptz,
 add column public_reviewed_at timestamptz,
 add column onboarding_completed_at timestamptz;
update public.organizations set onboarding_completed_at=now() where status='active';
alter table public.organizations alter column plan set default 'starter';
alter table public.organizations alter column features set default private.plan_features('starter');
-- Only implemented capabilities become effective. Future flags remain configurable schema keys.
create function private.feature_enabled(org uuid,feature text) returns boolean language sql stable security definer set search_path='' as $$
 select feature not in ('resident_messaging','online_applications','payment_integration','sms_notifications','analytics') and coalesce((select (coalesce(o.features->feature,private.plan_features(o.plan)->feature))='true'::jsonb from public.organizations o where o.id=org),false);
$$;
revoke all on function private.plan_features(text),private.valid_features(jsonb),private.feature_enabled(uuid,text) from public,anon,authenticated;
grant execute on function private.plan_features(text),private.valid_features(jsonb),private.feature_enabled(uuid,text) to authenticated;
create or replace function private.is_resident(org uuid, resident uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and private.feature_enabled(org,'resident_portal') and exists(select 1 from public.residents r join public.organization_memberships m on m.organization_id=r.organization_id and m.user_id=r.user_id where r.organization_id=org and r.id=resident and r.user_id=(select auth.uid()));
$$;
create or replace function private.lives_at(org uuid, property uuid, unit uuid default null) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and private.feature_enabled(org,'resident_portal') and exists(select 1 from public.residents r join public.organization_memberships m on m.organization_id=r.organization_id and m.user_id=r.user_id join public.lease_residents lr on lr.organization_id=r.organization_id and lr.resident_id=r.id join public.leases l on l.organization_id=lr.organization_id and l.id=lr.lease_id join public.units u on u.organization_id=l.organization_id and u.id=l.unit_id where r.organization_id=org and r.user_id=(select auth.uid()) and l.status='active' and u.property_id=property and (unit is null or u.id=unit));
$$;

-- Real property and apartment configuration; floor-plan dimensions stay normalized.
alter table public.properties add column photos text[] not null default '{}',add column office_hours text not null default '',add column office_phone text not null default '',add column office_email text not null default '',add column emergency_phone text not null default '';
alter table public.units add column deposit_cents integer not null default 0 check(deposit_cents>=0),add column photos text[] not null default '{}';
do $$ declare t text; begin
 foreach t in array array['properties','buildings','floor_plans','units'] loop
  execute format('drop policy active_organization on public.%I',t);
  execute format('create policy active_organization on public.%I as restrictive for all to authenticated using(private.organization_active(organization_id) or (select private.is_super_admin())) with check(private.organization_active(organization_id) or (select private.is_super_admin()))',t);
  execute format('create policy platform_setup_read on public.%I for select to authenticated using((select private.is_super_admin()))',t);
  execute format('create policy platform_setup_insert on public.%I for insert to authenticated with check((select private.is_super_admin()))',t);
  execute format('create policy platform_setup_update on public.%I for update to authenticated using((select private.is_super_admin())) with check((select private.is_super_admin()))',t);
 end loop;
end $$;
-- Feature checks supplement existing role/ownership rules; hiding navigation is not authorization.
do $$ declare t text; f text; begin
 foreach t in array array['documents','document_assignments','announcements','leases','lease_residents','payments','leads','leasing_intakes','applications','maintenance_requests','maintenance_updates','maintenance_attachments','maintenance_internal_notes'] loop
 f=case when t in ('documents','document_assignments') then 'documents' when t='announcements' then 'announcements' when t in ('leases','lease_residents') then 'lease_management' when t='payments' then 'resident_portal' when t in ('leads','leasing_intakes') then 'lead_capture' when t='applications' then 'property_listings' else 'maintenance_tracking' end;
 execute format('create policy enabled_feature on public.%I as restrictive for all to authenticated using(private.feature_enabled(organization_id,%L)) with check(private.feature_enabled(organization_id,%L))',t,f,f);
 end loop;
end $$;
create policy maintenance_submission_feature on public.maintenance_requests as restrictive for insert to authenticated with check(private.feature_enabled(organization_id,'maintenance_requests'));
create policy resident_portal_feature on public.residents as restrictive for select to authenticated using(private.has_role(organization_id,array['owner','property_manager','staff']::public.app_role[]) or private.feature_enabled(organization_id,'resident_portal'));

create table public.organization_invitations (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),email text not null check(email=lower(email) and length(email)<=254 and email like '%@%'),
 role public.app_role not null check(role in ('owner','admin','property_manager','maintenance','leasing','staff')),
 token_hash text not null unique check(token_hash ~ '^[0-9a-f]{64}$'),invited_by uuid not null references public.users(id),expires_at timestamptz not null default(now()+interval '7 days'),accepted_at timestamptz,revoked_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index organization_invitations_org_idx on public.organization_invitations(organization_id,email);
create index organization_invitations_actor_idx on public.organization_invitations(invited_by);
alter table public.organization_invitations enable row level security;
revoke all on public.organization_invitations from public,anon,authenticated;
grant select,insert on public.organization_invitations to authenticated;
grant update(revoked_at) on public.organization_invitations to authenticated;
grant all on public.organization_invitations to service_role;
create policy platform_invitations_read on public.organization_invitations for select to authenticated using((select private.is_super_admin()));
create policy platform_invitations_insert on public.organization_invitations for insert to authenticated with check((select private.is_super_admin()) and invited_by=(select auth.uid()));
create policy platform_invitations_update on public.organization_invitations for update to authenticated using((select private.is_super_admin())) with check((select private.is_super_admin()));
create trigger touch_record before update on public.organization_invitations for each row execute function private.touch_record();
-- The token is high entropy, hashed at rest and consumed under a row lock. Identity
-- comes from auth.users, not a submitted email or user-editable metadata.
create function private.accept_organization_invitation(token_hash text) returns uuid language plpgsql security definer set search_path='' as $$
 declare invitation public.organization_invitations; account_email text; result uuid;
 begin
 if auth.uid() is null then raise insufficient_privilege using message='Sign in to accept your invitation'; end if;
 select lower(email) into account_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
 select * into invitation from public.organization_invitations i where i.token_hash=accept_organization_invitation.token_hash for update;
 if invitation.id is null or account_email is null or account_email<>invitation.email or invitation.expires_at<=now() or invitation.accepted_at is not null or invitation.revoked_at is not null or exists(select 1 from public.organizations where id=invitation.organization_id and status='suspended') then raise insufficient_privilege using message='Invitation is unavailable for this account'; end if;
 insert into public.users(id,full_name,email) values(auth.uid(),split_part(account_email,'@',1),account_email) on conflict(id) do nothing;
 insert into public.organization_memberships(organization_id,user_id,role)values(invitation.organization_id,auth.uid(),invitation.role) on conflict(organization_id,user_id) do nothing;
 update public.organization_invitations set accepted_at=now() where id=invitation.id;
 return invitation.organization_id;
 end;
$$;
revoke all on function private.accept_organization_invitation(text) from public,anon,authenticated;
grant execute on function private.accept_organization_invitation(text) to authenticated;
create function public.accept_organization_invitation(p_hash text) returns uuid language sql security invoker set search_path='' as $$ select private.accept_organization_invitation(p_hash); $$;
revoke all on function public.accept_organization_invitation(text) from public,anon;
grant execute on function public.accept_organization_invitation(text) to authenticated;

create function private.onboarding_gaps(org uuid) returns text[] language plpgsql stable security definer set search_path='' as $$
 declare o public.organizations; gaps text[]='{}';
 begin
 select * into o from public.organizations where id=org;
 if o.id is null then return array['Organization'];end if;
 if coalesce(o.legal_name,'')='' or coalesce(o.phone,'')='' or coalesce(o.email,'')='' or coalesce(o.address,'')='' then gaps=array_append(gaps,'Company branding and contacts');end if;
 if not exists(select 1 from public.properties p where p.organization_id=org and p.published) or exists(select 1 from public.properties p where p.organization_id=org and p.published and (p.description='' or p.image='' or p.office_phone='' or p.emergency_phone='' or p.address='' or p.city='' or p.state='' or p.zip='')) then gaps=array_append(gaps,'A complete published property');end if;
 if not exists(select 1 from public.units u join public.properties p on p.organization_id=u.organization_id and p.id=u.property_id where u.organization_id=org and p.published) or exists(select 1 from public.properties p where p.organization_id=org and p.published and not exists(select 1 from public.units u where u.organization_id=org and u.property_id=p.id)) then gaps=array_append(gaps,'Units');end if;
 if not exists(select 1 from public.organization_memberships m where m.organization_id=org and m.role in ('owner','admin')) then gaps=array_append(gaps,'An accepted owner or admin invitation');end if;
 if private.feature_enabled(org,'resident_portal') and o.portal_configured_at is null then gaps=array_append(gaps,'Resident portal configuration');end if;
 if (private.feature_enabled(org,'maintenance_requests') or private.feature_enabled(org,'maintenance_tracking')) and o.maintenance_configured_at is null then gaps=array_append(gaps,'Maintenance configuration');end if;
 if o.payments_deferred_at is null then gaps=array_append(gaps,'Payment integration decision');end if;
 if private.feature_enabled(org,'website') and o.public_reviewed_at is null then gaps=array_append(gaps,'Public website review');end if;
 return gaps;
 end;
$$;
revoke all on function private.onboarding_gaps(uuid) from public,anon,authenticated;
create function public.organization_onboarding_gaps(p_org uuid) returns text[] language plpgsql security invoker set search_path='' as $$ begin if not private.is_super_admin() then raise insufficient_privilege;end if;return private.onboarding_gaps(p_org);end;$$;
grant execute on function private.onboarding_gaps(uuid) to authenticated;
revoke all on function public.organization_onboarding_gaps(uuid) from public,anon;
grant execute on function public.organization_onboarding_gaps(uuid) to authenticated;
-- Replace earlier lifecycle guard, retaining column-level and RLS restrictions.
create or replace function private.guard_platform_organization_fields() returns trigger language plpgsql set search_path='' as $$
 begin
 if current_user='authenticated' and not private.is_super_admin() and
 (new.status is distinct from old.status or new.subscription_status is distinct from old.subscription_status or new.plan is distinct from old.plan or new.features is distinct from old.features or new.portal_configured_at is distinct from old.portal_configured_at or new.maintenance_configured_at is distinct from old.maintenance_configured_at or new.payments_deferred_at is distinct from old.payments_deferred_at or new.public_reviewed_at is distinct from old.public_reviewed_at or new.onboarding_completed_at is distinct from old.onboarding_completed_at) then raise insufficient_privilege using message='Platform configuration requires a super admin';end if;
 if current_user='authenticated' and new.status in ('ready','active') and old.status is distinct from new.status and old.onboarding_completed_at is null and cardinality(private.onboarding_gaps(old.id))>0 then raise check_violation using message='Complete the onboarding checklist before activation';end if;
 if current_user='authenticated' and new.public_reviewed_at is not null and new.public_reviewed_at is distinct from old.public_reviewed_at and cardinality(array_remove(private.onboarding_gaps(old.id),'Public website review'))>0 then raise check_violation using message='Complete company, property, staff and feature setup before recording website review';end if;
 if new.status='active' and new.onboarding_completed_at is null then new.onboarding_completed_at=now();end if;
 if row(new.name,new.legal_name,new.logo_url,new.primary_color,new.secondary_color,new.phone,new.email,new.website,new.address,new.features) is distinct from row(old.name,old.legal_name,old.logo_url,old.primary_color,old.secondary_color,old.phone,old.email,old.website,old.address,old.features) then new.public_reviewed_at=null;end if;
 return new;
 end;
$$;
create function private.guard_new_organization() returns trigger language plpgsql set search_path='' as $$begin if current_user='authenticated' and (new.status<>'draft' or new.public_reviewed_at is not null or new.onboarding_completed_at is not null) then raise check_violation using message='New organizations must begin as private drafts';end if;return new;end;$$;
revoke all on function private.guard_new_organization() from public,anon,authenticated;
create trigger draft_organization before insert on public.organizations for each row execute function private.guard_new_organization();
grant update(plan,features,portal_configured_at,maintenance_configured_at,payments_deferred_at,public_reviewed_at) on public.organizations to authenticated;
create function private.invalidate_website_review() returns trigger language plpgsql security definer set search_path='' as $$begin update public.organizations set public_reviewed_at=null where id=coalesce(new.organization_id,old.organization_id) and public_reviewed_at is not null;return coalesce(new,old);end;$$;
revoke all on function private.invalidate_website_review() from public,anon,authenticated;
create trigger property_review_changed after insert or update or delete on public.properties for each row execute function private.invalidate_website_review();
create trigger unit_review_changed after insert or update or delete on public.units for each row execute function private.invalidate_website_review();

create function public.configure_organization_unit(p_org uuid,p_property uuid,p_unit uuid,p_data jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
 declare building uuid;plan_id uuid;result uuid;
 begin
 if not private.is_super_admin() then raise insufficient_privilege;end if;
 perform id from public.properties where id=p_property and organization_id=p_org for update;
 if not found then raise check_violation using message='Property not found in organization';end if;
 select id into building from public.buildings where organization_id=p_org and property_id=p_property and name=p_data->>'building';
 if building is null then insert into public.buildings(organization_id,property_id,name,floors)values(p_org,p_property,p_data->>'building',1)returning id into building;end if;
 select id into plan_id from public.floor_plans where organization_id=p_org and property_id=p_property and name=p_data->>'floor_plan' and bedrooms=(p_data->>'bedrooms')::int and bathrooms=(p_data->>'bathrooms')::numeric and sqft=(p_data->>'sqft')::int limit 1;
 if plan_id is null then insert into public.floor_plans(organization_id,property_id,name,bedrooms,bathrooms,sqft)values(p_org,p_property,p_data->>'floor_plan',(p_data->>'bedrooms')::int,(p_data->>'bathrooms')::numeric,(p_data->>'sqft')::int)returning id into plan_id;end if;
 if p_unit is null then
 insert into public.units(organization_id,property_id,building_id,floor_plan_id,number,floor,rent_cents,deposit_cents,status,available_on,photos)values(p_org,p_property,building,plan_id,p_data->>'number',1,(p_data->>'rent_cents')::int,(p_data->>'deposit_cents')::int,p_data->>'status',nullif(p_data->>'available_on','')::date,array(select jsonb_array_elements_text(p_data->'photos')))returning id into result;
 else
 update public.units set building_id=building,floor_plan_id=plan_id,number=p_data->>'number',rent_cents=(p_data->>'rent_cents')::int,deposit_cents=(p_data->>'deposit_cents')::int,status=p_data->>'status',available_on=nullif(p_data->>'available_on','')::date,photos=array(select jsonb_array_elements_text(p_data->'photos')) where id=p_unit and organization_id=p_org and property_id=p_property returning id into result;
 if result is null then raise check_violation using message='Unit not found in organization';end if;
 end if;return result;
 end;
$$;
revoke all on function public.configure_organization_unit(uuid,uuid,uuid,jsonb) from public,anon;
grant execute on function public.configure_organization_unit(uuid,uuid,uuid,jsonb) to authenticated;

-- A narrow public projection: never grant anonymous SELECT on private tenant tables.
create function private.organization_catalog(slug text,preview boolean) returns jsonb language plpgsql stable security definer set search_path='' as $$
 declare o public.organizations;data jsonb;
 begin
 preview=coalesce(preview,false);
 if preview and not private.is_super_admin() then raise insufficient_privilege;end if;
 select * into o from public.organizations where organizations.slug=organization_catalog.slug;
 if o.id is null or (not preview and (o.status<>'active' or o.public_reviewed_at is null or not private.feature_enabled(o.id,'website'))) then return null;end if;
 data=jsonb_build_object('id',o.id,'name',o.name,'slug',o.slug,'logo_url',o.logo_url,'primary_color',o.primary_color,'secondary_color',o.secondary_color,'phone',o.phone,'email',o.email,'website',o.website,'address',o.address,'features',jsonb_build_object('property_listings',private.feature_enabled(o.id,'property_listings'),'availability',private.feature_enabled(o.id,'availability'),'lead_capture',private.feature_enabled(o.id,'lead_capture'),'resident_portal',private.feature_enabled(o.id,'resident_portal')));
 return jsonb_build_object('organization',data,'properties',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'address',p.address,'city',p.city,'state',p.state,'zip',p.zip,'description',p.description,'image',p.image,'photos',p.photos,'amenities',p.amenities,'office_hours',p.office_hours,'office_phone',p.office_phone,'office_email',p.office_email,'emergency_phone',p.emergency_phone)) from public.properties p where p.organization_id=o.id and p.published and private.feature_enabled(o.id,'property_listings')),'[]'::jsonb),'units',coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'property_id',u.property_id,'number',u.number,'rent_cents',u.rent_cents,'deposit_cents',u.deposit_cents,'available_on',u.available_on,'photos',u.photos,'floor_plan',f.name,'bedrooms',f.bedrooms,'bathrooms',f.bathrooms,'sqft',f.sqft)) from public.units u join public.floor_plans f on f.organization_id=u.organization_id and f.id=u.floor_plan_id join public.properties p on p.organization_id=u.organization_id and p.id=u.property_id where u.organization_id=o.id and u.status='available' and p.published and private.feature_enabled(o.id,'property_listings') and private.feature_enabled(o.id,'availability')),'[]'::jsonb));
 end;
$$;
revoke all on function private.organization_catalog(text,boolean) from public;
grant usage on schema private to anon;
grant execute on function private.organization_catalog(text,boolean) to anon,authenticated;
create function public.organization_catalog(p_slug text,p_preview boolean default false) returns jsonb language sql security invoker set search_path='' as $$select private.organization_catalog(p_slug,p_preview);$$;
revoke all on function public.organization_catalog(text,boolean) from public;
grant execute on function public.organization_catalog(text,boolean) to anon,authenticated;
-- Marketing uploads stay in a private bucket. Public downloads are limited to
-- assets referenced by a reviewed, active website; draft assets require super admin.
create table public.organization_assets (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),path text not null unique,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$' and path like organization_id::text||'/%')
);
create index organization_assets_org_idx on public.organization_assets(organization_id);
alter table public.organization_assets enable row level security;
revoke all on public.organization_assets from public,anon,authenticated;
grant select,insert on public.organization_assets to authenticated;
grant all on public.organization_assets to service_role;
create policy platform_assets_read on public.organization_assets for select to authenticated using((select private.is_super_admin()));
create policy platform_assets_insert on public.organization_assets for insert to authenticated with check((select private.is_super_admin()));
create trigger touch_record before update on public.organization_assets for each row execute function private.touch_record();
create function private.marketing_asset_readable(object_path text) returns boolean language plpgsql stable security definer set search_path='' as $$
 declare org uuid;url text;
 begin
 if private.is_super_admin() then return true;end if;
 select organization_id into org from public.organization_assets where path=object_path;
 if org is null then return false;end if;
 url='/api/organization-media/'||object_path;
 return exists(select 1 from public.organizations o where o.id=org and o.status='active' and o.public_reviewed_at is not null and private.feature_enabled(org,'website') and (o.logo_url=url or (private.feature_enabled(org,'property_listings') and exists(select 1 from public.properties p where p.organization_id=org and p.published and (p.image=url or url=any(p.photos) or (private.feature_enabled(org,'availability') and exists(select 1 from public.units u where u.organization_id=org and u.property_id=p.id and u.status='available' and url=any(u.photos))))))));
 end;
$$;
revoke all on function private.marketing_asset_readable(text) from public;
grant execute on function private.marketing_asset_readable(text) to anon,authenticated;
do $$ begin
 if to_regclass('storage.buckets') is not null then
 insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('organization-marketing','organization-marketing',false,2097152,array['image/webp']) on conflict(id) do update set public=false,file_size_limit=2097152,allowed_mime_types=array['image/webp'];
 execute $policy$create policy property_hub_marketing_upload on storage.objects for insert to authenticated with check(bucket_id='organization-marketing' and (select private.is_super_admin()) and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$')$policy$;
 execute $policy$create policy property_hub_marketing_read on storage.objects for select to anon,authenticated using(bucket_id='organization-marketing' and private.marketing_asset_readable(name))$policy$;
 execute $policy$create policy property_hub_marketing_cleanup on storage.objects for delete to authenticated using(bucket_id='organization-marketing' and (select private.is_super_admin()))$policy$;
 end if;
end $$;

alter table public.leads add column message text not null default '' check(length(message)<=2000),add column request_key uuid;
create unique index leads_request_key_idx on public.leads(organization_id,request_key) where request_key is not null;
create function private.capture_organization_lead(slug text,property_id uuid,request_key uuid,payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
 declare org uuid;result uuid; contact_email text=lower(trim(payload->>'email'));
 begin
 select o.id into org from public.organizations o where o.slug=capture_organization_lead.slug and o.status='active' and o.public_reviewed_at is not null and private.feature_enabled(o.id,'website') and private.feature_enabled(o.id,'property_listings') and private.feature_enabled(o.id,'lead_capture');
 if org is null or not exists(select 1 from public.properties p where p.organization_id=org and p.id=capture_organization_lead.property_id and p.published) then raise insufficient_privilege using message='This property is not accepting inquiries';end if;
 if contact_email is null or length(contact_email)>254 or contact_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or coalesce(length(trim(payload->>'name')),0) not between 2 and 120 or coalesce(length(payload->>'phone'),0) not between 7 and 40 or coalesce(length(payload->>'message'),0)>2000 or request_key is null then raise check_violation using message='Check inquiry details';end if;
 perform pg_advisory_xact_lock(hashtextextended(org::text||contact_email,0));
 select l.id into result from public.leads l where l.organization_id=org and l.request_key=capture_organization_lead.request_key;
 if result is not null then return result;end if;
 if (select count(*) from public.leads l where l.organization_id=org and l.email=contact_email and l.created_at>now()-interval '1 hour')>=3 then raise check_violation using message='Please contact the office for further help';end if;
 insert into public.leads(organization_id,property_id,name,email,phone,source,status,interested_bedrooms,desired_move_in,message,request_key) values(org,property_id,trim(payload->>'name'),contact_email,payload->>'phone','Organization website','New',0,nullif(payload->>'desired_move_in','')::date,coalesce(payload->>'message',''),request_key)returning id into result;
 return result;
 end;
$$;
revoke all on function private.capture_organization_lead(text,uuid,uuid,jsonb) from public;
grant execute on function private.capture_organization_lead(text,uuid,uuid,jsonb) to anon,authenticated;
create function public.capture_organization_lead(p_slug text,p_property uuid,p_request uuid,p_payload jsonb) returns uuid language sql security invoker set search_path='' as $$select private.capture_organization_lead(p_slug,p_property,p_request,p_payload);$$;
revoke all on function public.capture_organization_lead(text,uuid,uuid,jsonb) from public;
grant execute on function public.capture_organization_lead(text,uuid,uuid,jsonb) to anon,authenticated;

commit;
