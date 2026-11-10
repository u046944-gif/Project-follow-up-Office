-- F1: limit profile directory reads to self, admins, and people who share a plan with the caller.

create or replace function public.shares_plan_with(u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.plans p
    where auth.uid() = any(p.members) and u = any(p.members)
  )
$$;

revoke execute on function public.shares_plan_with(uuid) from public;
revoke execute on function public.shares_plan_with(uuid) from anon;
grant execute on function public.shares_plan_with(uuid) to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or (public.can_read() and public.shares_plan_with(id))
  );
