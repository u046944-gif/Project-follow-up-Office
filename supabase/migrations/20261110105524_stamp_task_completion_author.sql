-- F4: who completed a task, and when, is decided by the server rather than the client.

create or replace function public.task_stamp_completion() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  if new.progress = 'completed' then
    if tg_op = 'INSERT' then
      new.completed_by := coalesce(me, new.completed_by);
      new.completed_at := now();
    elsif old.progress is distinct from 'completed' then
      new.completed_by := coalesce(me, new.completed_by);
      new.completed_at := now();
    else
      new.completed_by := old.completed_by;
      new.completed_at := old.completed_at;
    end if;
  else
    new.completed_by := null;
    new.completed_at := null;
  end if;
  return new;
end $$;

revoke execute on function public.task_stamp_completion() from public;
revoke execute on function public.task_stamp_completion() from anon;

drop trigger if exists task_stamp_completion_ins on public.tasks;
create trigger task_stamp_completion_ins before insert on public.tasks
  for each row execute function public.task_stamp_completion();

drop trigger if exists task_stamp_completion_upd on public.tasks;
create trigger task_stamp_completion_upd before update on public.tasks
  for each row execute function public.task_stamp_completion();
