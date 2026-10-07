-- Only needed if you ran schema.sql BEFORE account deletion was added.
-- (A fresh run of the current schema.sql already includes this.)
-- Makes stickers survive when their maker deletes their account.

alter table stickers alter column owner_id drop not null;
alter table stickers drop constraint if exists stickers_owner_id_fkey;
alter table stickers
  add constraint stickers_owner_id_fkey
  foreign key (owner_id) references auth.users (id) on delete set null;

create or replace function random_sticker(uid uuid)
returns setof stickers
language sql
as $$
  select * from stickers
  where owner_id is distinct from uid and not hidden
  order by random() limit 1;
$$;
