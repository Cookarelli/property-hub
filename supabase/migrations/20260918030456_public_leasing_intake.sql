-- Guest leasing inquiries are kept separate from screened rental applications.
begin;
alter table public.properties add column application_mode text not null default 'internal' check(application_mode in ('internal','external'));
alter table public.properties add column application_url text;
alter table public.properties add constraint application_provider_url check (
 (application_mode='internal' and application_url is null) or
 (application_mode='external' and application_url ~ '^https://[^/@[:space:]]+([/?#]|$)')
);
alter table public.tour_requests alter column user_id drop not null;
alter table public.tour_requests alter column unit_id drop not null;
create table public.leasing_intakes (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 property_id uuid not null, unit_id uuid, floor_plan_id uuid,
 kind text not null check(kind in ('application','tour')), session_id uuid not null, request_id uuid not null,
 payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text) <= 12000),
 lead_id uuid, tour_request_id uuid,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,id), unique(organization_id,session_id,request_id),
 foreign key(organization_id,property_id) references public.properties(organization_id,id),
 foreign key(organization_id,property_id,unit_id) references public.units(organization_id,property_id,id),
 foreign key(organization_id,property_id,floor_plan_id) references public.floor_plans(organization_id,property_id,id),
 foreign key(organization_id,lead_id) references public.leads(organization_id,id),
 foreign key(organization_id,tour_request_id) references public.tour_requests(organization_id,id),
 check((kind='application' and lead_id is not null and tour_request_id is null) or (kind='tour' and tour_request_id is not null and lead_id is null))
);
create index leasing_intakes_session_idx on public.leasing_intakes(organization_id,session_id,created_at desc);
create index leasing_intakes_property_idx on public.leasing_intakes(organization_id,property_id);
create index leasing_intakes_unit_idx on public.leasing_intakes(organization_id,property_id,unit_id);
create index leasing_intakes_plan_idx on public.leasing_intakes(organization_id,property_id,floor_plan_id);
create index leasing_intakes_lead_idx on public.leasing_intakes(organization_id,lead_id);
create index leasing_intakes_tour_idx on public.leasing_intakes(organization_id,tour_request_id);
alter table public.leasing_intakes enable row level security;
create policy leasing_staff_read on public.leasing_intakes for select to authenticated
 using(private.has_role(organization_id,array['owner','property_manager','staff']::public.app_role[]));
revoke all on public.leasing_intakes from anon,authenticated;
grant select on public.leasing_intakes to authenticated;
create trigger touch_leasing_intakes before update on public.leasing_intakes for each row execute function private.touch_record();

-- Invoker rights: this RPC is callable only by the trusted server, never demo personas.
create function public.submit_leasing_intake(p_org uuid,p_session uuid,p_request uuid,p_payload jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare
 v_id uuid; v_lead uuid; v_tour uuid; v_property uuid := (p_payload->>'propertyId')::uuid;
 v_unit uuid := nullif(p_payload->>'unitId','')::uuid;
 v_plan uuid := nullif(p_payload->>'floorPlanId','')::uuid;
 v_kind text := p_payload->>'kind'; v_beds integer := 0; v_available date; v_mode text;
begin
 -- Serialize one browser session so retries and quotas are atomic across workers.
 perform pg_advisory_xact_lock(hashtextextended(p_org::text || p_session::text,0));
 select id into v_id from public.leasing_intakes where organization_id=p_org and session_id=p_session and request_id=p_request;
 if v_id is not null then return v_id; end if;
 if (select count(*) from public.leasing_intakes where organization_id=p_org and session_id=p_session and created_at > now()-interval '1 hour') >= 20 then
   raise exception 'Too many requests. Please try again later.' using errcode='P0001';
 end if;
 select application_mode into v_mode from public.properties where id=v_property and organization_id=p_org and published;
 if v_mode is null then raise exception 'Community is not published'; end if;
 if v_kind='application' and v_mode='external' then raise exception 'This community uses an external application provider'; end if;
 if v_unit is not null then
   select floor_plan_id,available_on into v_plan,v_available from public.units where id=v_unit and organization_id=p_org and property_id=v_property and status='available';
   if not found then raise exception 'Apartment is not available'; end if;
   if nullif(p_payload->>'floorPlanId','') is not null and v_plan<>(p_payload->>'floorPlanId')::uuid then raise exception 'Floor plan does not match apartment'; end if;
 end if;
 if v_plan is not null then
   select bedrooms into v_beds from public.floor_plans where id=v_plan and organization_id=p_org and property_id=v_property;
   if not found then raise exception 'Floor plan does not belong to community'; end if;
 end if;
 if v_kind='application' then
   if v_plan is null then raise exception 'A floor plan or apartment is required'; end if;
   if (p_payload->>'moveIn')::date < v_available then raise exception 'Apartment is not available on requested move-in date'; end if;
   insert into public.leads(organization_id,property_id,name,email,source,status,interested_bedrooms)
   values(p_org,v_property,concat_ws(' ',p_payload->>'firstName',p_payload->>'lastName'),p_payload->>'email','Website application inquiry','New',v_beds) returning id into v_lead;
 elsif v_kind='tour' then
   insert into public.tour_requests(organization_id,property_id,unit_id,user_id,scheduled_at,status)
   values(p_org,v_property,v_unit,null,((p_payload->>'date') || ' ' || (p_payload->>'time'))::timestamp at time zone 'America/Chicago','requested') returning id into v_tour;
 else raise exception 'Invalid inquiry kind'; end if;
 insert into public.leasing_intakes(organization_id,property_id,unit_id,floor_plan_id,kind,session_id,request_id,payload,lead_id,tour_request_id)
 values(p_org,v_property,v_unit,v_plan,v_kind,p_session,p_request,p_payload,v_lead,v_tour) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.submit_leasing_intake(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant usage on schema public to service_role;
grant select on public.properties,public.units,public.floor_plans to service_role;
grant select,insert on public.leads,public.tour_requests,public.leasing_intakes to service_role;
grant execute on function public.submit_leasing_intake(uuid,uuid,uuid,jsonb) to service_role;
commit;
