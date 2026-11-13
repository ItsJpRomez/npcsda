-- =========================================================
-- NPC SDA Church website: starting content
-- Copies everything currently on the website into the database,
-- so nothing is lost when the Admin Panel takes over.
-- Run AFTER schema.sql. Safe to run again: each table is only
-- filled if it is still empty, so it never overwrites your edits.
-- Items marked "placeholder" still need real details.
-- =========================================================

insert into public.church_info
  (id, name, short_name, denomination, address, map_query, phone, email, facebook_url,
   member_count, founded_year, about_heading, intro, mission, vision)
values (
  1,
  'NPC Seventh-day Adventist Church',
  'NPC SDA Church',
  'Seventh-day Adventist',
  'Blk 7 Lot 83 Binga St., Napocor Village, Brgy. Pasong Tamo, Quezon City, Philippines',
  'Binga St, Napocor Village, Pasong Tamo, Quezon City',
  '09123456789',
  'npctsora.sdachurch1998@gmail.com',
  'https://www.facebook.com/npcsdachurch1998',
  '150+',  -- placeholder: update the member count
  1998,
  'A family of faith in Napocor Village',
  E'Since 1998, NPC Seventh-day Adventist Church has been a place where neighbors in Pasong Tamo come to study God''s Word, worship together on the Sabbath, and serve our community with open hands.\n\nWhether you''ve been an Adventist all your life or you''re just curious about faith, you belong here.',
  'To make disciples of Jesus Christ who live as His loving witnesses and share the everlasting gospel with everyone, in preparation for His soon return.',
  'A Christ-centered, Bible-believing church family that is a light to Quezon City through worship, fellowship, health, and service.'
)
on conflict (id) do nothing;

insert into public.services (name, day_of_week, start_time, end_time, is_main, sort_order)
select * from (values
  ('Midweek Prayer Meeting', 3, time '19:00', time '21:00', false, 10),
  ('Vesper Service',         5, time '19:00', time '21:00', false, 20),
  ('Sabbath School',         6, time '08:30', time '10:30', false, 30),
  ('Divine Service',         6, time '10:30', time '12:00', true,  40),
  ('Adventist Youth (AY)',   6, time '14:00', time '16:00', false, 50)
) v
where not exists (select 1 from public.services);

-- placeholder events: replace with your real ones
insert into public.events
  (kind, title, category, description, starts_at, ends_at, schedule_note, status, is_featured)
select * from (values
  ('event', 'Week of Prayer', 'Evangelism', 'Nightly worship and messages of hope. Bring a friend!',
     timestamptz '2026-11-22 19:00+08', timestamptz '2026-11-29 21:00+08', 'Nightly, 7:00 PM', 'upcoming', true),
  ('event', 'Health Expo & Free Check-ups', 'Community', 'Blood pressure, BMI, and healthy-cooking demo for the whole barangay.',
     timestamptz '2026-12-06 08:00+08', timestamptz '2026-12-06 12:00+08', null, 'upcoming', false),
  ('event', 'Christmas Cantata', 'Music', 'An evening of carols and the story of Christ''s birth, presented by our choir and youth.',
     timestamptz '2026-12-20 18:00+08', null, null, 'upcoming', false),
  ('announcement', 'Baptismal class', null, 'Meets every Sabbath at 4:00 PM after AY. Talk to Pastor Jemuel to join.',
     null, null, null, 'ongoing', false)
) v
where not exists (select 1 from public.events);

insert into public.ministries (name, description, icon, sort_order)
select * from (values
  ('Youth Ministry',      'Adventist Youth programs, Bible study, and outreach for young people.',   'users',     10),
  ('Pathfinders',         'Ages 10â€“15. Camping, honors, drills, and character building.',            'compass',   20),
  ('Adventurers',         'Ages 4â€“9. Fun, faith-filled activities for little ones and their families.', 'star',   30),
  ('Women''s Ministry',   'Fellowship, prayer, and support for women in every season of life.',      'sparkle',   40),
  ('Music Ministry',      'Choir, praise team, and special music for worship.',                      'music',     50),
  ('Health Ministry',     'Health talks, cooking classes, and wellness programs for our community.', 'activity',  60),
  ('Personal Ministries', 'Bible studies, evangelism, and sharing hope door to door.',               'megaphone', 70),
  ('Family & Community',  'Family life seminars, feeding programs, and disaster relief.',            'home',      80)
) v
where not exists (select 1 from public.ministries);

-- Officer names other than the pastor are placeholders (left blank)
insert into public.officers (full_name, position, is_featured, sort_order)
select * from (values
  ('Ptr. Jemuel Abcede', 'Church Pastor',                 true,  10),
  (null,                 'Head Elder',                    false, 20),
  (null,                 'Church Clerk',                  false, 30),
  (null,                 'Treasurer',                     false, 40),
  (null,                 'Head Deacon',                   false, 50),
  (null,                 'Head Deaconess',                false, 60),
  (null,                 'Sabbath School Superintendent', false, 70),
  (null,                 'AY Leader',                     false, 80)
) v
where not exists (select 1 from public.officers);

insert into public.albums (name, sort_order)
select * from (values
  ('Church building', 10),
  ('Worship',         20),
  ('Youth',           30),
  ('Community',       40)
) v
where not exists (select 1 from public.albums);

-- Gallery: only the church image is a real photo; the rest are placeholder tiles
-- (shown with an icon) until you upload a photo for them in the Admin Panel.
insert into public.photos (album_id, image_url, caption, icon, sort_order)
select (select id from public.albums where name = v.album), v.image_url, v.caption, v.icon, v.sort_order
from (values
  ('Church building', '/assets/church.jpg', 'Our church home',     null,       10),
  ('Worship',         null,                'Divine worship',      'church',   20),
  ('Worship',         null,                'Baptism',             'heart',    30),
  ('Youth',           null,                'Pathfinder Day',      'compass',  40),
  ('Youth',           null,                'Youth gathering',     'users',    50),
  ('Worship',         null,                'Choir',               'music',    60),
  ('Community',       null,                'Health Expo',         'activity', 70),
  ('Community',       null,                'Community outreach',  'home',     80),
  ('Worship',         null,                'Church family photo', 'camera',   90)
) v (album, image_url, caption, icon, sort_order)
where not exists (select 1 from public.photos);

insert into public.building_fund (id, title, description, goal, raised, image_url, image_caption, form_url)
values (
  1,
  'Church Building Fund',
  'We''re building a house of worship for the generations to come: a sanctuary with room to grow, classrooms for our children, and space to serve Napocor Village.',
  5000000,   -- placeholder goal
  1850000,   -- placeholder amount raised
  '/assets/church.jpg',
  'Artist''s rendering of our new sanctuary',
  null       -- paste your Google Form link in the Admin Panel
)
on conflict (id) do nothing;

insert into public.giving (id, note, form_url, form_label)
values (
  1,
  'Please note "Tithe", "Offering", or "Building Fund" on each gift, and message us a photo of your receipt so we can issue an official receipt.',
  null,
  'Give online'
)
on conflict (id) do nothing;

-- placeholder account details: replace in the Admin Panel
insert into public.giving_methods (title, icon, bank_name, account_name, account_number, note, sort_order)
select * from (values
  ('GCash',        'phone2', null,        'NPC SDA Church Treasurer',          '0900 000 0000', null, 10),
  ('Bank deposit', 'bank',   'Bank name', 'NPC Seventh-day Adventist Church',  '0000-0000-00',  null, 20),
  ('In person',    'church', null,        null,                                null,
     'Use a tithe envelope during Sabbath worship, or hand it to our church treasurer.', 30)
) v
where not exists (select 1 from public.giving_methods);

insert into public.resources (category, title, description, url, sort_order)
select * from (values
  ('bible',          'Holy Bible',             'Read and search Scripture online in English, Tagalog, and many other versions.',   'https://www.biblegateway.com/', 10),
  ('sabbath_school', 'Sabbath School Lessons', 'This quarter''s Adult Bible Study Guide, with a daily lesson to prepare for Sabbath.', 'https://www.sabbath.school/',  20),
  ('devotional',     'Daily Devotionals',      'Start each morning with daily devotional readings and the writings of Ellen G. White.', 'https://egwwritings.org/',  30),
  ('prayer',         'Prayer Requests',        'Our prayer team would be honored to pray with you. Share what''s on your heart.',  '#prayer',                       40)
) v
where not exists (select 1 from public.resources);
