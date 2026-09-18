-- Enum additions commit before policies use the new values.
alter type public.app_role add value if not exists 'admin';
alter type public.app_role add value if not exists 'leasing';
