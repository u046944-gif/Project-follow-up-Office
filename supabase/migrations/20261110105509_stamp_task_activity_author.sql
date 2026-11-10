-- F3: task activity entries are stamped with the caller's id, and entries already
-- recorded cannot be rewritten by the client.

create or replace function public.task_before_update() returns trigger
language plpgsql set search_path = public as $$
declare
  me uuid := auth.uid();
  e jsonb;
  kept jsonb := '[]'::jsonb;
begin
  new.num := old.num;
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  new.updated_by := coalesce(me, new.updated_by);
  new.updated_at := now();

  if me is not null and new.activity is distinct from old.activity then
    if jsonb_typeof(coalesce(new.activity, 'null'::jsonb)) = 'array' then
      for e in select value from jsonb_array_elements(new.activity) loop
        if coalesce(old.activity, '[]'::jsonb) @> jsonb_build_array(e) then
          kept := kept || jsonb_build_array(e);
        elsif jsonb_typeof(e) = 'object' then
          kept := kept || jsonb_build_array(jsonb_set(e, '{by}', to_jsonb(me::text), true));
        else
          kept := kept || jsonb_build_array(e);
        end if;
      end loop;
      new.activity := kept;
    else
      new.activity := coalesce(old.activity, '[]'::jsonb);
    end if;
  end if;

  return new;
end $$;

drop trigger if exists task_before_update on public.tasks;
create trigger task_before_update before update on public.tasks
  for each row execute function public.task_before_update();
