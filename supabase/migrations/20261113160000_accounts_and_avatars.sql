-- Keep finance records and uploaded profile images scoped to each account.
create table if not exists public.user_finance_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_finance_data enable row level security;
revoke all on table public.user_finance_data from anon, authenticated;
grant select, insert, update on table public.user_finance_data to authenticated;

drop policy if exists "Users read their own finance data" on public.user_finance_data;
create policy "Users read their own finance data"
on public.user_finance_data
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users create their own finance data" on public.user_finance_data;
create policy "Users create their own finance data"
on public.user_finance_data
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users update their own finance data" on public.user_finance_data;
create policy "Users update their own finance data"
on public.user_finance_data
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload their own avatars" on storage.objects;
create policy "Users upload their own avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete their own avatars" on storage.objects;
create policy "Users delete their own avatars"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
