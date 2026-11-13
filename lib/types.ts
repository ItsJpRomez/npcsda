/* Shapes of the rows stored in Supabase (see supabase/schema.sql). */

export interface ChurchInfo {
  id: number;
  name: string;
  short_name: string | null;
  denomination: string | null;
  address: string | null;
  map_query: string | null;
  phone: string | null;
  email: string | null;
  facebook_url: string | null;
  member_count: string | null;
  founded_year: number | null;
  about_heading: string | null;
  intro: string | null;
  mission: string | null;
  vision: string | null;
  history: string | null;
  updated_at?: string;
}

interface Row {
  id: string;
  created_at?: string;
  updated_at?: string;
}

interface Listed extends Row {
  sort_order: number;
  published: boolean;
}

export interface Service extends Listed {
  name: string;
  day_of_week: number;            // 0 = Sunday … 6 = Saturday
  start_time: string;             // "HH:MM" or "HH:MM:SS", Manila time
  end_time: string;
  is_main: boolean;
}

export interface Milestone extends Listed {
  year: number | null;
  title: string;
  description: string | null;
  image_url: string | null;
}

export interface Officer extends Listed {
  full_name: string | null;
  position: string;
  image_url: string | null;
  bio: string | null;
  is_featured: boolean;
}

export type EventKind = 'event' | 'announcement';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed';

export interface ChurchEvent extends Row {
  kind: EventKind;
  title: string;
  category: string | null;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  schedule_note: string | null;
  location: string | null;
  image_url: string | null;
  link_url: string | null;
  status: EventStatus;
  is_featured: boolean;
  published: boolean;
}

export interface Ministry extends Listed {
  name: string;
  description: string | null;
  leader: string | null;
  schedule: string | null;
  image_url: string | null;
  icon: string | null;
}

export interface Album extends Row {
  name: string;
  description: string | null;
  sort_order: number;
}

export interface Photo extends Listed {
  album_id: string | null;
  image_url: string | null;
  caption: string | null;
  description: string | null;
  icon: string | null;
}

export interface BuildingFund {
  id: number;
  title: string | null;
  description: string | null;
  goal: number;
  raised: number;
  image_url: string | null;
  image_caption: string | null;
  form_url: string | null;
  updated_at?: string;
}

export interface Giving {
  id: number;
  note: string | null;
  form_url: string | null;
  form_label: string | null;
  updated_at?: string;
}

export interface GivingMethod extends Listed {
  title: string;
  icon: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  note: string | null;
}

export type ResourceCategory = 'bible' | 'sabbath_school' | 'devotional' | 'sermon' | 'study' | 'prayer';

export interface Resource extends Listed {
  category: ResourceCategory;
  title: string;
  description: string | null;
  url: string | null;
  image_url: string | null;
}

/** Everything the public page needs, already filtered to published items. */
export interface SiteContent {
  info: ChurchInfo;
  services: Service[];
  events: ChurchEvent[];
  ministries: Ministry[];
  officers: Officer[];
  milestones: Milestone[];
  albums: Album[];
  photos: Photo[];
  fund: BuildingFund;
  giving: Giving;
  givingMethods: GivingMethod[];
  resources: Resource[];
}
