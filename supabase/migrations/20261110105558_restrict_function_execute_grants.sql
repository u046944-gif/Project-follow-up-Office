-- F7: the app's own SECURITY DEFINER functions are no longer callable by visitors
-- who are not signed in. The five helpers the RLS policies evaluate keep EXECUTE
-- for the authenticated role; the trigger functions need no direct grant at all.

revoke execute on function public.my_role() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.can_edit() from public, anon;
revoke execute on function public.can_read() from public, anon;
revoke execute on function public.can_see_plan(uuid) from public, anon;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_profile() from public, anon, authenticated;
revoke execute on function public.comment_before_insert() from public, anon, authenticated;
revoke execute on function public.task_before_insert() from public, anon, authenticated;
revoke execute on function public.task_before_update() from public, anon, authenticated;
revoke execute on function public.task_stamp_completion() from public, anon, authenticated;

grant execute on function public.my_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_edit() to authenticated;
grant execute on function public.can_read() to authenticated;
grant execute on function public.can_see_plan(uuid) to authenticated;
grant execute on function public.shares_plan_with(uuid) to authenticated;
