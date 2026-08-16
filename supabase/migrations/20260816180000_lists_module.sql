-- Lists module ("Listas"): the first real per-family module, built on top of
-- families/family_members. A list is either "privada" (only its creator can
-- see/edit it, even though it still belongs to a family) or "compartida"
-- (any member of that family can see/edit it).

-- ── Tables ──────────────────────────────────────────────────────────────────

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null check (category in ('compra', 'tareas', 'otros')),
  visibility text not null check (visibility in ('privada', 'compartida')),
  created_at timestamptz not null default now()
);

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id) on delete cascade
);

create index if not exists lists_family_id_idx on public.lists (family_id);
create index if not exists lists_created_by_idx on public.lists (created_by);
create index if not exists list_items_list_id_idx on public.list_items (list_id);

alter table public.lists enable row level security;
alter table public.list_items enable row level security;

-- ── Access check helper ─────────────────────────────────────────────────────
-- security definer for the same reason as is_family_member(): list_items'
-- policies need to look up the parent list without tripping over lists' own
-- RLS in a way that's fragile to reason about.

create or replace function public.can_access_list(target_list_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.lists l
    where l.id = target_list_id
      and (
        (l.visibility = 'compartida' and public.is_family_member(l.family_id))
        or (l.visibility = 'privada' and l.created_by = auth.uid())
      )
  );
$$;

revoke all on function public.can_access_list(uuid) from public;
grant execute on function public.can_access_list(uuid) to authenticated;

-- ── RLS policies: lists ──────────────────────────────────────────────────────

drop policy if exists "Users can view their accessible lists" on public.lists;
create policy "Users can view their accessible lists"
on public.lists
for select
to authenticated
using (
  (visibility = 'compartida' and public.is_family_member(family_id))
  or (visibility = 'privada' and created_by = auth.uid())
);

drop policy if exists "Users can create lists in their family" on public.lists;
create policy "Users can create lists in their family"
on public.lists
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_family_member(family_id)
);

drop policy if exists "Users can update their accessible lists" on public.lists;
create policy "Users can update their accessible lists"
on public.lists
for update
to authenticated
using (
  (visibility = 'compartida' and public.is_family_member(family_id))
  or (visibility = 'privada' and created_by = auth.uid())
)
with check (
  (visibility = 'compartida' and public.is_family_member(family_id))
  or (visibility = 'privada' and created_by = auth.uid())
);

drop policy if exists "Users can delete their accessible lists" on public.lists;
create policy "Users can delete their accessible lists"
on public.lists
for delete
to authenticated
using (
  (visibility = 'compartida' and public.is_family_member(family_id))
  or (visibility = 'privada' and created_by = auth.uid())
);

-- ── RLS policies: list_items ─────────────────────────────────────────────────

drop policy if exists "Users can view items of accessible lists" on public.list_items;
create policy "Users can view items of accessible lists"
on public.list_items
for select
to authenticated
using (public.can_access_list(list_id));

drop policy if exists "Users can add items to accessible lists" on public.list_items;
create policy "Users can add items to accessible lists"
on public.list_items
for insert
to authenticated
with check (created_by = auth.uid() and public.can_access_list(list_id));

drop policy if exists "Users can update items of accessible lists" on public.list_items;
create policy "Users can update items of accessible lists"
on public.list_items
for update
to authenticated
using (public.can_access_list(list_id))
with check (public.can_access_list(list_id));

drop policy if exists "Users can delete items of accessible lists" on public.list_items;
create policy "Users can delete items of accessible lists"
on public.list_items
for delete
to authenticated
using (public.can_access_list(list_id));

-- ── Table grants ─────────────────────────────────────────────────────────────

grant select, insert, update, delete on public.lists to authenticated;
grant select, insert, update, delete on public.list_items to authenticated;
