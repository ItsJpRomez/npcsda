/* What each Admin Panel section manages: its table, form fields, filters and list display. */
import { DAYS, fmtDate, peso, timeLabel } from '@/lib/format';
import type { FieldDef } from './fields';

type R = Record<string, unknown>;
const s = (v: unknown) => (v == null ? '' : String(v));

export interface RowView {
  image?: string | null;
  icon: string;
  title: string;
  sub?: string;
  badges?: ([string, 'sky' | 'gold' | 'green' | 'gray' | 'warn'] | false | null | undefined)[];
}

export interface ListSection {
  table: string;
  title: string;
  singular: string;
  icon: string;
  intro?: string;
  sortable?: boolean;
  order?: [string, { ascending?: boolean; nullsFirst?: boolean }?][];
  clientSort?: (a: R, b: R) => number;
  search: string[];
  filters?: { key: string; label: string; options: [string, string][] }[];
  defaults: R;
  fields: FieldDef[];
  validate?: (v: R) => [string, string] | null;
  row: (r: R) => RowView;
}

export interface SingleSection {
  table: string;
  title: string;
  intro?: string;
  groups: { title: string; desc?: string; fields: FieldDef[] }[];
  preview?: (v: Record<string, string | boolean>) => { pct: number; text: string };
}

export const ICONS: [string, string][] = [
  ['users', 'People'], ['compass', 'Compass'], ['star', 'Star'], ['sparkle', 'Sparkle'], ['music', 'Music'],
  ['activity', 'Health'], ['megaphone', 'Megaphone'], ['home', 'Home'], ['heart', 'Heart'], ['book', 'Book'],
  ['church', 'Church'], ['sun', 'Sun'], ['camera', 'Camera'], ['calendar', 'Calendar'],
];
export const RES_CATS: [string, string][] = [
  ['bible', 'Bible'], ['sabbath_school', 'Sabbath School lesson'], ['devotional', 'Devotional'],
  ['sermon', 'Sermon'], ['study', 'Bible study material'], ['prayer', 'Prayer'],
];
const RES_ICON: Record<string, string> = { bible: 'book', sabbath_school: 'users', devotional: 'sun', sermon: 'play', study: 'book', prayer: 'heart' };
export const STATUS: [string, string][] = [['upcoming', 'Upcoming'], ['ongoing', 'Ongoing'], ['completed', 'Completed']];
const label = (list: [string, string][], v: unknown) => (list.find((o) => o[0] === String(v)) ?? [, s(v)])[1];
const published: FieldDef = { key: 'published', label: 'Show on the website', type: 'checkbox', full: true };
const dayOptions = DAYS.map((d, i) => [i, d] as [number, string]);

export const SECTIONS = {
  services: {
    table: 'services', title: 'Worship schedule', singular: 'service', icon: 'clock',
    intro: 'These times appear in Service Times, the “Next service” countdown on the home page and the Visit Us schedule.',
    order: [['day_of_week'], ['start_time']],
    search: ['name'],
    filters: [{ key: 'day_of_week', label: 'All days', options: DAYS.map((d, i) => [String(i), d] as [string, string]) }],
    defaults: { day_of_week: 6, published: true },
    fields: [
      { key: 'name', label: 'Service name', type: 'text', required: true, full: true, placeholder: 'e.g. Divine Service' },
      { key: 'day_of_week', label: 'Day', type: 'select', required: true, cast: 'int', options: dayOptions, full: true },
      { key: 'start_time', label: 'Starts at', type: 'time', required: true },
      { key: 'end_time', label: 'Ends at', type: 'time', required: true },
      { key: 'is_main', label: 'Highlight as the main worship service', type: 'checkbox', full: true },
      published,
    ],
    validate: (v) => (v.end_time && v.start_time && s(v.end_time) <= s(v.start_time) ? ['end_time', 'The end time must be later than the start time.'] : null),
    row: (r) => ({
      icon: 'clock', title: s(r.name),
      sub: `${DAYS[Number(r.day_of_week)]} · ${timeLabel(s(r.start_time))} – ${timeLabel(s(r.end_time))}`,
      badges: [r.is_main ? ['Main service', 'sky'] : null],
    }),
  },

  events: {
    table: 'events', title: 'Events & announcements', singular: 'event or announcement', icon: 'calendar',
    intro: 'Upcoming and ongoing items show on the website. Completed items, and events whose date has passed, are hidden automatically.',
    order: [['starts_at', { ascending: true, nullsFirst: false }]],
    clientSort: (a, b) =>
      STATUS.findIndex((x) => x[0] === a.status) - STATUS.findIndex((x) => x[0] === b.status)
      || (a.starts_at ? Date.parse(s(a.starts_at)) : Infinity) - (b.starts_at ? Date.parse(s(b.starts_at)) : Infinity),
    search: ['title', 'description', 'location', 'category'],
    filters: [
      { key: 'kind', label: 'All types', options: [['event', 'Events only'], ['announcement', 'Announcements only']] },
      { key: 'status', label: 'Any status', options: STATUS },
    ],
    defaults: { kind: 'event', status: 'upcoming', published: true },
    fields: [
      { key: 'kind', label: 'Type', type: 'select', required: true, options: [['event', 'Event (has a date)'], ['announcement', 'Announcement (short notice)']] },
      { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS },
      { key: 'title', label: 'Title', type: 'text', required: true, full: true, placeholder: 'e.g. Week of Prayer' },
      { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Community, Music, Youth' },
      { key: 'location', label: 'Location', type: 'text', placeholder: 'Leave blank if at the church' },
      { key: 'starts_at', label: 'Starts', type: 'datetime', help: 'Philippine time' },
      { key: 'ends_at', label: 'Ends', type: 'datetime', help: 'Optional' },
      { key: 'schedule_note', label: 'Time note', type: 'text', full: true, placeholder: 'Optional, e.g. Nightly, 7:00 PM', help: 'Shown instead of the times, for events that run over several days.' },
      { key: 'description', label: 'Description', type: 'textarea', full: true },
      { key: 'link_url', label: 'Registration or information link', type: 'url', full: true, placeholder: 'https://…' },
      { key: 'image_url', label: 'Cover photo', type: 'image', folder: 'events', full: true },
      { key: 'is_featured', label: 'Feature this event (shown large at the top)', type: 'checkbox', full: true },
      published,
    ],
    validate: (v) => {
      if (v.kind === 'event' && !v.starts_at) return ['starts_at', 'Please choose when the event starts.'];
      if (v.starts_at && v.ends_at && Date.parse(s(v.ends_at)) <= Date.parse(s(v.starts_at))) return ['ends_at', 'The end must be later than the start.'];
      return null;
    },
    row: (r) => ({
      image: r.image_url as string | null, icon: r.kind === 'announcement' ? 'megaphone' : 'calendar', title: s(r.title),
      sub: r.kind === 'announcement' ? s(r.description) || 'Announcement' : [fmtDate(r.starts_at as string | null), s(r.location)].filter(Boolean).join(' · '),
      badges: [
        [r.kind === 'announcement' ? 'Announcement' : 'Event', 'gray'],
        [label(STATUS, r.status), r.status === 'completed' ? 'gray' : r.status === 'ongoing' ? 'green' : 'sky'],
        r.is_featured ? ['Featured', 'gold'] : null,
      ],
    }),
  },

  ministries: {
    table: 'ministries', title: 'Ministries', singular: 'ministry', icon: 'users', sortable: true,
    intro: 'The first ministry is shown largest on the website. Use the arrows to change the order.',
    search: ['name', 'description', 'leader'],
    defaults: { icon: 'users', published: true },
    fields: [
      { key: 'name', label: 'Ministry name', type: 'text', required: true, full: true },
      { key: 'description', label: 'Description', type: 'textarea', full: true },
      { key: 'leader', label: 'Ministry leader', type: 'text' },
      { key: 'schedule', label: 'Meeting schedule', type: 'text', placeholder: 'e.g. Sabbaths, 2:00 PM' },
      { key: 'image_url', label: 'Photo', type: 'image', folder: 'ministries', full: true },
      { key: 'icon', label: 'Icon (used when there is no photo)', type: 'select', options: ICONS, full: true },
      published,
    ],
    row: (r) => ({ image: r.image_url as string | null, icon: s(r.icon) || 'users', title: s(r.name), sub: [s(r.leader), s(r.schedule)].filter(Boolean).join(' · ') || s(r.description) }),
  },

  officers: {
    table: 'officers', title: 'Church officers', singular: 'officer', icon: 'user', sortable: true,
    intro: 'Turn on “pastor card” for the one person shown large at the top (usually the pastor). Use the arrows to change the order.',
    search: ['full_name', 'position', 'bio'],
    defaults: { published: true },
    fields: [
      { key: 'full_name', label: 'Full name', type: 'text', placeholder: 'Leave blank to show “To be announced”' },
      { key: 'position', label: 'Position', type: 'text', required: true, placeholder: 'e.g. Head Elder' },
      { key: 'image_url', label: 'Profile photo', type: 'image', folder: 'officers', full: true },
      { key: 'bio', label: 'Short description', type: 'textarea', full: true },
      { key: 'is_featured', label: 'Show as the large pastor card', type: 'checkbox', full: true },
      published,
    ],
    row: (r) => ({
      image: r.image_url as string | null, icon: 'user', title: s(r.full_name) || 'Name to be announced', sub: s(r.position),
      badges: [r.is_featured ? ['Pastor card', 'gold'] : null, !r.full_name ? ['Needs a name', 'warn'] : null],
    }),
  },

  milestones: {
    table: 'milestones', title: 'Milestones', singular: 'milestone', icon: 'history',
    order: [['year', { ascending: true, nullsFirst: false }], ['sort_order']],
    search: ['title', 'description'],
    defaults: { published: true },
    fields: [
      { key: 'year', label: 'Year', type: 'number', min: 1800, max: 2200, placeholder: 'e.g. 1998' },
      { key: 'title', label: 'What happened', type: 'text', required: true, placeholder: 'e.g. First Sabbath service' },
      { key: 'description', label: 'Details', type: 'textarea', full: true },
      { key: 'image_url', label: 'Historical photo', type: 'image', folder: 'history', full: true },
      published,
    ],
    row: (r) => ({ image: r.image_url as string | null, icon: 'history', title: `${r.year ? `${r.year} · ` : ''}${s(r.title)}`, sub: s(r.description) }),
  },

  resources: {
    table: 'resources', title: 'Spiritual resources', singular: 'resource', icon: 'book', sortable: true,
    intro: 'Bible study materials, devotionals, sermons and prayer resources. Links open in a new tab on the website.',
    search: ['title', 'description', 'url'],
    filters: [{ key: 'category', label: 'All categories', options: RES_CATS }],
    defaults: { category: 'study', published: true },
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, full: true },
      { key: 'category', label: 'Category', type: 'select', required: true, options: RES_CATS },
      { key: 'url', label: 'Link', type: 'link', required: true, placeholder: 'https://…', help: 'A web address, or #prayer for the prayer form on this site.' },
      { key: 'description', label: 'Description', type: 'textarea', full: true },
      { key: 'image_url', label: 'Cover image', type: 'image', folder: 'resources', full: true, help: 'Optional. Without one, an icon for the category is shown.' },
      published,
    ],
    row: (r) => ({ image: r.image_url as string | null, icon: RES_ICON[s(r.category)] ?? 'book', title: s(r.title), sub: s(r.url), badges: [[label(RES_CATS, r.category), 'sky']] }),
  },

  giving_methods: {
    table: 'giving_methods', title: 'Ways to give', singular: 'giving method', icon: 'gift', sortable: true,
    search: ['title', 'bank_name', 'account_name', 'account_number'],
    defaults: { icon: 'phone2', published: true },
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. GCash, Bank deposit' },
      { key: 'icon', label: 'Icon', type: 'select', options: [['phone2', 'Mobile wallet'], ['bank', 'Bank'], ['church', 'Church'], ['gift', 'Gift']] },
      { key: 'bank_name', label: 'Bank name', type: 'text', placeholder: 'Only for bank deposits' },
      { key: 'account_name', label: 'Account name', type: 'text' },
      { key: 'account_number', label: 'Account or mobile number', type: 'text', full: true, help: 'Visitors get a button to copy this number.' },
      { key: 'note', label: 'Instructions', type: 'textarea', full: true },
      published,
    ],
    row: (r) => ({ icon: s(r.icon) || 'gift', title: s(r.title), sub: [s(r.bank_name), s(r.account_name), s(r.account_number)].filter(Boolean).join(' · ') || s(r.note) }),
  },
} satisfies Record<string, ListSection>;

export type ListSectionKey = keyof typeof SECTIONS;

const fundPreview = (v: Record<string, string | boolean>) => {
  const goal = Number(v.goal) || 0;
  const raised = Number(v.raised) || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  return { pct, text: `${pct}% of ${peso(goal)} · ${peso(Math.max(0, goal - raised))} still needed` };
};

export const SINGLES = {
  church: {
    table: 'church_info', title: 'Church information',
    intro: 'These details appear across the website: the home page, About, Visit Us, the map and the footer.',
    groups: [
      { title: 'Basics', fields: [
        { key: 'name', label: 'Church name', type: 'text', required: true, full: true, help: 'Shown as the large title on the home page.' },
        { key: 'short_name', label: 'Short name', type: 'text', help: 'Shown next to the logo, e.g. NPC SDA Church.' },
        { key: 'denomination', label: 'Denomination', type: 'text' },
        { key: 'member_count', label: 'Member count', type: 'text', placeholder: 'e.g. 150+' },
      ] },
      { title: 'Contact & location', fields: [
        { key: 'address', label: 'Address', type: 'text', full: true },
        { key: 'map_query', label: 'Map search', type: 'text', full: true, help: 'What Google Maps searches for, for the map and Get directions. A shorter street address often finds the place more accurately.' },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'email', label: 'Email address', type: 'email', help: 'Prayer requests are sent here too.' },
        { key: 'facebook_url', label: 'Facebook page', type: 'url', full: true, placeholder: 'https://www.facebook.com/…' },
      ] },
      { title: 'Who we are', fields: [
        { key: 'about_heading', label: 'About heading', type: 'text', full: true },
        { key: 'intro', label: 'Introduction', type: 'textarea', full: true, rows: 6, help: 'Leave an empty line between paragraphs.' },
        { key: 'mission', label: 'Mission', type: 'textarea', full: true },
        { key: 'vision', label: 'Vision', type: 'textarea', full: true },
      ] },
    ],
  },
  history: {
    table: 'church_info', title: 'Church history',
    groups: [
      { title: 'Our story', desc: 'Shown in the About section, with the milestones below as a timeline.', fields: [
        { key: 'founded_year', label: 'Founding year', type: 'number', min: 1800, max: 2200 },
        { key: 'history', label: 'Church history and introduction', type: 'textarea', full: true, rows: 8, help: 'Leave an empty line between paragraphs.' },
      ] },
    ],
  },
  fund: {
    table: 'building_fund', title: 'Building fund',
    intro: 'Update the amounts whenever new donations are counted. Donations are made only through your Google Form; this site never handles payments.',
    groups: [
      { title: 'Project', fields: [
        { key: 'title', label: 'Project title', type: 'text', required: true, full: true },
        { key: 'description', label: 'Description', type: 'textarea', full: true },
        { key: 'image_url', label: 'Project photo', type: 'image', folder: 'building', full: true },
        { key: 'image_caption', label: 'Photo caption', type: 'text', full: true },
      ] },
      { title: 'Fundraising progress', fields: [
        { key: 'goal', label: 'Fundraising target (₱)', type: 'money', required: true },
        { key: 'raised', label: 'Amount raised so far (₱)', type: 'money', required: true },
        { key: 'form_url', label: 'Donation Google Form link', type: 'url', full: true, placeholder: 'https://forms.gle/…', help: 'The “Donate now” button opens this form. Leave blank to send visitors to the giving details instead.' },
      ] },
    ],
    preview: fundPreview,
  },
  giving: {
    table: 'giving', title: 'Tithes & offerings',
    intro: 'Giving happens outside this website, through GCash, bank deposit, in person, or a Google Form. No payments are processed here.',
    groups: [
      { title: 'Giving instructions', fields: [
        { key: 'note', label: 'Instructions for givers', type: 'textarea', full: true },
        { key: 'form_url', label: 'Google Form or giving link', type: 'url', placeholder: 'https://forms.gle/…', help: 'Optional. Adds a button to the Tithes & Offerings section.' },
        { key: 'form_label', label: 'Button label', type: 'text', placeholder: 'Give online' },
      ] },
    ],
  },
} satisfies Record<string, SingleSection>;

export type SingleSectionKey = keyof typeof SINGLES;
