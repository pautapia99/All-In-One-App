-- Family module: the base every other module (listas, calendario, presupuesto...)
-- will share data through. A user belongs to at most one family; membership is
-- what scopes all future per-family data.

create extension if not exists pgcrypto;

-- ── Tables ──────────────────────────────────────────────────────────────────

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create index if not exists family_members_user_id_idx on public.family_members (user_id);
create index if not exists family_members_family_id_idx on public.family_members (family_id);

alter table public.families enable row level security;
alter table public.family_members enable row level security;

-- ── Membership check helper ─────────────────────────────────────────────────
-- security definer so it reads family_members without going back through this
-- table's own RLS policies (which would otherwise reference this same
-- function) — the standard, recursion-free way to do this in Postgres/Supabase.

create or replace function public.is_family_member(check_family_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members
    where family_id = check_family_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_family_member(uuid) from public;
grant execute on function public.is_family_member(uuid) to authenticated;

-- ── RLS policies ─────────────────────────────────────────────────────────────

create policy "Members can view their families"
on public.families
for select
to authenticated
using (public.is_family_member(id));

create policy "Members can update their families"
on public.families
for update
to authenticated
using (public.is_family_member(id))
with check (public.is_family_member(id));

-- "Any authenticated user can create a family" — kept as a real table policy
-- for completeness, though the app creates families through create_family()
-- below (atomic: family row + creator's membership row together).
create policy "Authenticated users can create families"
on public.families
for insert
to authenticated
with check (created_by = auth.uid());

create policy "Members can view their family's members"
on public.family_members
for select
to authenticated
using (public.is_family_member(family_id));

-- Deliberately no INSERT policy on family_members: "join only if you know the
-- invite code" isn't expressible as a row policy (a policy can check who you
-- are, not a secret you typed in). That check has to happen at insert time,
-- so joining goes exclusively through join_family_by_code() below.

-- ── Invite codes ─────────────────────────────────────────────────────────────

create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
as $$
declare
  -- Alphanumeric, uppercase, no ambiguous chars (0/O, 1/I) — meant to be
  -- read aloud or typed in by hand.
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- ── Family creation / joining (RPCs) ────────────────────────────────────────
-- Both run as security definer so they can atomically write to both tables
-- in one transaction, and so join_family_by_code can enforce the invite-code
-- check that RLS alone can't express.

create or replace function public.create_family(family_name text)
returns public.families
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  new_family public.families;
  attempt int := 0;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if trim(family_name) = '' then
    raise exception 'invalid_name';
  end if;

  loop
    new_code := public.generate_invite_code();
    attempt := attempt + 1;
    begin
      insert into public.families (name, invite_code, created_by)
      values (trim(family_name), new_code, auth.uid())
      returning * into new_family;
      exit;
    exception when unique_violation then
      if attempt >= 10 then
        raise exception 'could_not_generate_code';
      end if;
    end;
  end loop;

  insert into public.family_members (family_id, user_id)
  values (new_family.id, auth.uid())
  on conflict do nothing;

  return new_family;
end;
$$;

create or replace function public.join_family_by_code(code text)
returns public.families
language plpgsql
security definer
set search_path = public
as $$
declare
  target_family public.families;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into target_family
  from public.families
  where invite_code = upper(trim(code));

  if not found then
    raise exception 'invalid_code';
  end if;

  insert into public.family_members (family_id, user_id)
  values (target_family.id, auth.uid())
  on conflict do nothing;

  return target_family;
end;
$$;

revoke all on function public.create_family(text) from public;
revoke all on function public.join_family_by_code(text) from public;
grant execute on function public.create_family(text) to authenticated;
grant execute on function public.join_family_by_code(text) to authenticated;

-- ── Member listing with email ───────────────────────────────────────────────
-- auth.users isn't exposed to PostgREST, so member emails have to come
-- through a security-definer function scoped to callers who are themselves
-- members of the requested family.

create or replace function public.get_family_members(target_family_id uuid)
returns table (
  user_id uuid,
  email text,
  joined_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select fm.user_id, u.email, fm.joined_at
  from public.family_members fm
  join auth.users u on u.id = fm.user_id
  where fm.family_id = target_family_id
    and public.is_family_member(target_family_id)
  order by fm.joined_at asc;
$$;

revoke all on function public.get_family_members(uuid) from public;
grant execute on function public.get_family_members(uuid) to authenticated;

-- ── Table grants ─────────────────────────────────────────────────────────────
-- RLS still gates every row; these grants just allow the authenticated role
-- to attempt the statements the policies above police.

grant select, insert, update on public.families to authenticated;
grant select on public.family_members to authenticated;
