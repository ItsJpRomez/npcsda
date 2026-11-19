-- Bible verses that rotate in the home page hero. Managed in the Admin Panel (Hero verses).

create table if not exists public.verses (
  id          uuid primary key default gen_random_uuid(),
  text        text not null,
  reference   text not null,
  sort_order  int not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists touch_verses on public.verses;
create trigger touch_verses before update on public.verses
  for each row execute function public.touch_updated_at();

grant select on public.verses to anon, authenticated;
grant insert, update, delete on public.verses to authenticated;

alter table public.verses enable row level security;
drop policy if exists "Public reads published" on public.verses;
create policy "Public reads published" on public.verses
  for select using (published or public.is_admin());
drop policy if exists "Admins manage" on public.verses;
create policy "Admins manage" on public.verses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Starting list (King James Version); only added when the table is empty
insert into public.verses (text, reference, sort_order)
select v.text, v.reference, v.sort_order
from (values
  ('But grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ. To him be glory both now and for ever. Amen.', '2 Peter 3:18', 10),
  ('Come unto me, all ye that labour and are heavy laden, and I will give you rest.', 'Matthew 11:28', 20),
  ('Remember the sabbath day, to keep it holy.', 'Exodus 20:8', 30),
  ('God is our refuge and strength, a very present help in trouble.', 'Psalm 46:1', 40),
  ('Thy word is a lamp unto my feet, and a light unto my path.', 'Psalm 119:105', 50),
  ('For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', 'John 3:16', 60),
  ('Trust in the LORD with all thine heart; and lean not unto thine own understanding.', 'Proverbs 3:5', 70),
  ('Here is the patience of the saints: here are they that keep the commandments of God, and the faith of Jesus.', 'Revelation 14:12', 80),
  ('The LORD is my shepherd; I shall not want.', 'Psalm 23:1', 90),
  ('Jesus Christ the same yesterday, and to day, and for ever.', 'Hebrews 13:8', 100)
) as v(text, reference, sort_order)
where not exists (select 1 from public.verses);
