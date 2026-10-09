-- Run once in the Supabase SQL editor on a database created before sticker backgrounds existed.
-- Existing stickers become white. Safe to run twice.
alter table stickers
  add column if not exists bg text not null default 'white'
  check (bg in ('white', 'sky', 'pink', 'yellow', 'mint', 'lavender', 'cream'));
