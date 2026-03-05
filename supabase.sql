create table if not exists public.portfolio_content (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_content enable row level security;

drop policy if exists "public_read_portfolio" on public.portfolio_content;
create policy "public_read_portfolio"
on public.portfolio_content
for select
to anon, authenticated
using (true);

drop policy if exists "authenticated_write_portfolio" on public.portfolio_content;
create policy "authenticated_write_portfolio"
on public.portfolio_content
for all
to authenticated
using (true)
with check (true);

insert into public.portfolio_content (key, data)
values ('primary', '{}'::jsonb)
on conflict (key) do nothing;
