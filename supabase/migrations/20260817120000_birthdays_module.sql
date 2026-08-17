-- Birthdays module ("Cumpleaños"): family members already have a birth date
-- in `profiles` (asked at sign-up, always known), so this table only holds
-- birthdays added manually for people who aren't app users themselves (kids,
-- grandparents...). Every birthday in a family is visible/editable by every
-- member — there's no privado/compartido distinction here, unlike lists or
-- events.

create table if not exists public.birthdays (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  name text not null,
  birth_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists birthdays_family_id_idx on public.birthdays (family_id);

alter table public.birthdays enable row level security;

-- ── RLS policies ─────────────────────────────────────────────────────────────

drop policy if exists "Family members can view birthdays" on public.birthdays;
create policy "Family members can view birthdays"
on public.birthdays
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists "Family members can add birthdays" on public.birthdays;
create policy "Family members can add birthdays"
on public.birthdays
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_family_member(family_id)
);

drop policy if exists "Family members can update birthdays" on public.birthdays;
create policy "Family members can update birthdays"
on public.birthdays
for update
to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

drop policy if exists "Family members can delete birthdays" on public.birthdays;
create policy "Family members can delete birthdays"
on public.birthdays
for delete
to authenticated
using (public.is_family_member(family_id));

grant select, insert, update, delete on public.birthdays to authenticated;

-- ── Family members' birthdays ───────────────────────────────────────────────
-- `profiles`' own RLS only lets a user read their own row, so family
-- members' birth dates (needed for the combined "Cumpleaños" list) have to
-- come through a security-definer function scoped to callers who are
-- themselves members of the requested family — same technique as
-- get_family_members().

create or replace function public.get_family_member_birthdays(target_family_id uuid)
returns table (
  user_id uuid,
  name text,
  birth_date date
)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, p.alias, p.birth_date
  from public.family_members fm
  join public.profiles p on p.id = fm.user_id
  where fm.family_id = target_family_id
    and public.is_family_member(target_family_id)
  order by fm.joined_at asc;
$$;

revoke all on function public.get_family_member_birthdays(uuid) from public;
grant execute on function public.get_family_member_birthdays(uuid) to authenticated;
