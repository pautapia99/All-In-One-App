-- Budget module ("Presupuesto"): categories are shared structure for the
-- whole family (like a shared list, always visible/editable by every
-- member); expenses follow the same privado/compartido pattern as lists and
-- events.

-- ── Tables ──────────────────────────────────────────────────────────────────

create table if not exists public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null,
  monthly_limit numeric not null check (monthly_limit >= 0),
  color text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.budget_categories (id) on delete cascade,
  concept text not null,
  amount numeric not null check (amount > 0),
  expense_date date not null,
  visibility text not null check (visibility in ('privado', 'compartido')),
  created_at timestamptz not null default now()
);

create index if not exists budget_categories_family_id_idx on public.budget_categories (family_id);
create index if not exists expenses_family_id_idx on public.expenses (family_id);
create index if not exists expenses_category_id_idx on public.expenses (category_id);
create index if not exists expenses_expense_date_idx on public.expenses (expense_date);

alter table public.budget_categories enable row level security;
alter table public.expenses enable row level security;

-- ── RLS policies: budget_categories ─────────────────────────────────────────
-- Categories are the shape of the family's budget, not individual expenses,
-- so — unlike expenses — every member can see and manage every category.

drop policy if exists "Family members can view categories" on public.budget_categories;
create policy "Family members can view categories"
on public.budget_categories
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists "Family members can create categories" on public.budget_categories;
create policy "Family members can create categories"
on public.budget_categories
for insert
to authenticated
with check (public.is_family_member(family_id));

drop policy if exists "Family members can update categories" on public.budget_categories;
create policy "Family members can update categories"
on public.budget_categories
for update
to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

drop policy if exists "Family members can delete categories" on public.budget_categories;
create policy "Family members can delete categories"
on public.budget_categories
for delete
to authenticated
using (public.is_family_member(family_id));

-- ── RLS policies: expenses ───────────────────────────────────────────────────

drop policy if exists "Users can view their accessible expenses" on public.expenses;
create policy "Users can view their accessible expenses"
on public.expenses
for select
to authenticated
using (
  (visibility = 'compartido' and public.is_family_member(family_id))
  or (visibility = 'privado' and created_by = auth.uid())
);

drop policy if exists "Users can create expenses in their family" on public.expenses;
create policy "Users can create expenses in their family"
on public.expenses
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_family_member(family_id)
);

drop policy if exists "Users can update their accessible expenses" on public.expenses;
create policy "Users can update their accessible expenses"
on public.expenses
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

drop policy if exists "Users can delete their accessible expenses" on public.expenses;
create policy "Users can delete their accessible expenses"
on public.expenses
for delete
to authenticated
using (
  (visibility = 'compartido' and public.is_family_member(family_id))
  or (visibility = 'privado' and created_by = auth.uid())
);

-- ── Table grants ─────────────────────────────────────────────────────────────

grant select, insert, update, delete on public.budget_categories to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;

-- ── get_family_members: add alias ───────────────────────────────────────────
-- The budget screen needs to show who registered each shared expense (a
-- name, not just an email). Rather than add a one-off RPC, this extends the
-- existing get_family_members() additively — its return type is changing, so
-- the function has to be dropped first (create or replace can't change a
-- function's return columns). Every existing caller (e.g. "Mi familia")
-- keeps working unchanged since it only reads the columns it already knew
-- about.

drop function if exists public.get_family_members(uuid);

create function public.get_family_members(target_family_id uuid)
returns table (
  user_id uuid,
  email text,
  alias text,
  joined_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select fm.user_id, u.email, p.alias, fm.joined_at
  from public.family_members fm
  join auth.users u on u.id = fm.user_id
  left join public.profiles p on p.id = fm.user_id
  where fm.family_id = target_family_id
    and public.is_family_member(target_family_id)
  order by fm.joined_at asc;
$$;

revoke all on function public.get_family_members(uuid) from public;
grant execute on function public.get_family_members(uuid) to authenticated;
