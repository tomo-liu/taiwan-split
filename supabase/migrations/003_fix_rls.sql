-- Missing UPDATE policies that caused silent failures on expense edits and group status changes
create policy "public update expenses" on expenses for update using (true);
create policy "public update groups" on groups for update using (true);
