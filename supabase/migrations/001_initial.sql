-- groups
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- members
create table members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  name text not null,
  color text not null,
  device_id text not null,
  created_at timestamptz not null default now()
);

-- expenses
create table expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  paid_by uuid not null references members(id) on delete cascade,
  amount integer not null check (amount > 0),
  description text not null,
  created_at timestamptz not null default now()
);

-- expense_splits: which members share each expense
create table expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  unique (expense_id, member_id)
);

-- Row Level Security (anon access for account-free usage)
alter table groups enable row level security;
alter table members enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;

create policy "public read groups" on groups for select using (true);
create policy "public insert groups" on groups for insert with check (true);
create policy "public update groups" on groups for update using (true);

create policy "public read members" on members for select using (true);
create policy "public insert members" on members for insert with check (true);

create policy "public read expenses" on expenses for select using (true);
create policy "public insert expenses" on expenses for insert with check (true);
create policy "public update expenses" on expenses for update using (true);
create policy "public delete expenses" on expenses for delete using (true);

create policy "public read expense_splits" on expense_splits for select using (true);
create policy "public insert expense_splits" on expense_splits for insert with check (true);
create policy "public delete expense_splits" on expense_splits for delete using (true);

-- Realtime
alter publication supabase_realtime add table members;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table expense_splits;
