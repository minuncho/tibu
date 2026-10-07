-- Run once in the Supabase SQL editor.
-- All access goes through the Next.js server with the service-role key,
-- so RLS is enabled with no policies (clients cannot touch tables directly).

create sequence if not exists sticker_serial minvalue 0 start 0;

create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  candidates jsonb not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists generations_user_date on generations (user_id, local_date);

create table if not exists stickers (
  id uuid primary key default gen_random_uuid(),
  serial_no bigint not null unique default nextval('sticker_serial'),
  -- becomes null when the maker deletes their account; the sticker itself stays
  owner_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(name) between 1 and 20),
  bubble text not null check (char_length(bubble) between 1 and 50),
  style text not null check (style in ('real', '3d', '2d')),
  image_path text not null,
  country text not null check (country ~ '^[A-Z]{2}$'),
  -- set when staff uphold a report; hidden stickers leave the draw pool and all albums
  hidden boolean not null default false,
  local_date date not null,
  created_at timestamptz not null default now()
);
create index if not exists stickers_owner_date on stickers (owner_id, local_date);

create table if not exists draws (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sticker_id uuid not null references stickers (id) on delete cascade,
  local_date date not null,
  -- true when paid with a saved credit instead of the daily allowance
  used_credit boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists draws_user_date on draws (user_id, local_date);
create index if not exists draws_user_created on draws (user_id, created_at);

-- Ledger of draw credits that do not expire (+ report rewards, - spent draws).
create table if not exists credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists credits_user on credits (user_id);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  sticker_id uuid not null references stickers (id) on delete cascade,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'upheld', 'rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (reporter_id, sticker_id)
);
create index if not exists reports_status on reports (status, created_at);

-- While now() < until, the user cannot make stickers.
create table if not exists penalties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  until timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists penalties_user on penalties (user_id, until);

alter table generations enable row level security;
alter table stickers enable row level security;
alter table draws enable row level security;
alter table credits enable row level security;
alter table reports enable row level security;
alter table penalties enable row level security;

-- Every visible sticker not owned by the caller has the same chance.
create or replace function random_sticker(uid uuid)
returns setof stickers
language sql
as $$
  select * from stickers
  where owner_id is distinct from uid and not hidden
  order by random() limit 1;
$$;
revoke execute on function random_sticker(uuid) from public, anon, authenticated;
grant execute on function random_sticker(uuid) to service_role;

-- Public bucket for pet cutout images.
insert into storage.buckets (id, name, public)
values ('stickers', 'stickers', true)
on conflict (id) do nothing;
