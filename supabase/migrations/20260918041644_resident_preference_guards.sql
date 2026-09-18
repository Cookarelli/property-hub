begin;
drop policy request_insert on public.maintenance_requests;
create policy request_insert on public.maintenance_requests for insert to authenticated with check(
 private.has_role(organization_id,array['owner','property_manager']::public.app_role[])
 or (private.is_resident(organization_id,resident_id) and private.lives_at(organization_id,property_id,unit_id)
 and status='open' and assigned_to is null and scheduled_for is null)
);
-- RLS controls rows, not columns. Existing managers retain full editing grants;
-- residents may change only their contact preferences, never identity/linkage.
create function private.guard_resident_preferences() returns trigger language plpgsql set search_path='' as $$
 begin
 if current_user='authenticated' and not private.has_role(old.organization_id,array['owner','property_manager']::public.app_role[])
 and (to_jsonb(new)-array['phone','contact_preference','community_notifications','maintenance_notifications','payment_notifications','updated_at'])
 is distinct from (to_jsonb(old)-array['phone','contact_preference','community_notifications','maintenance_notifications','payment_notifications','updated_at'])
 then raise exception 'Residents may only update contact preferences'; end if;
 return new;
 end;
$$;
revoke all on function private.guard_resident_preferences() from public,anon,authenticated;
create trigger guard_resident_preferences before update on public.residents for each row execute function private.guard_resident_preferences();
commit;
