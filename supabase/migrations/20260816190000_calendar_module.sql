-- Calendar module ("Calendario"): a single `events` table scoped to a
-- family. An event is either "privado" (only its creator can see/edit it,
-- even though it still belongs to a family) or "compartido" (any member of
-- that family can see/edit it) — same access pattern as lists, but using
-- the masculine forms since these are "eventos".

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_all_day boolean not null default false,
  visibility text not null check (visibility in ('privado', 'compartido')),
  created_at timestamptz not null default now()
);

create index if not exists events_family_id_idx on public.events (family_id);
create index if not exists events_created_by_idx on public.events (created_by);
create index if not exists events_start_at_idx on public.events (start_at);

alter table public.events enable row level security;

-- ── RLS policies ─────────────────────────────────────────────────────────────
-- Reuses is_family_member() from the family module — no extra helper needed
-- here since, unlike lists, there's no child table whose visibility depends
-- on this one.

drop policy if exists "Users can view their accessible events" on public.events;
create policy "Users can view their accessible events"
on public.events
for select
to authenticated
using (
  (visibility = 'compartido' and public.is_family_member(family_id))
  or (visibility = 'privado' and created_by = auth.uid())
);

drop policy if exists "Users can create events in their family" on public.events;
create policy "Users can create events in their family"
on public.events
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_family_member(family_id)
);

drop policy if exists "Users can update their accessible events" on public.events;
create policy "Users can update their accessible events"
on public.events
for update
to authenticated
using (
  (visibility = 'compartido' and public.is_family_member(family_id))
  or (visibility = 'privado' and created_by = auth.uid())
)
with check (
  (visibility = 'compartido' and public.is_family_member(family_id))
  or (visibility = 'privado' and created_by = auth.uid())
);

drop policy if exists "Users can delete their accessible events" on public.events;
create policy "Users can delete their accessible events"
on public.events
for delete
to authenticated
using (
  (visibility = 'compartido' and public.is_family_member(family_id))
  or (visibility = 'privado' and created_by = auth.uid())
);

-- ── Table grants ─────────────────────────────────────────────────────────────

grant select, insert, update, delete on public.events to authenticated;
