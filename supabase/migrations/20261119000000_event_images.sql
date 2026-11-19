-- Events and announcements can have several photos.
-- images[1] is the cover; image_url is kept in sync with it so older code keeps working.

alter table public.events
  add column if not exists images text[] not null default '{}';

update public.events
   set images = array[image_url]
 where image_url is not null
   and cardinality(images) = 0;
