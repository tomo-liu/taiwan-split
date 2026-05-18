-- Add status to groups (active → completed when all settled)
alter table groups
  add column if not exists status text not null default 'active'
  check (status in ('active', 'completed'));

-- Track which calculated transfers have actually been paid
create table if not exists settled_transfers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  from_member_id uuid not null references members(id) on delete cascade,
  to_member_id uuid not null references members(id) on delete cascade,
  amount integer not null,
  created_at timestamptz not null default now(),
  unique (group_id, from_member_id, to_member_id)
);

alter table settled_transfers enable row level security;
create policy "public read settled_transfers" on settled_transfers for select using (true);
create policy "public insert settled_transfers" on settled_transfers for insert with check (true);
create policy "public delete settled_transfers" on settled_transfers for delete using (true);
