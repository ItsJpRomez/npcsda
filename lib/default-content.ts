import type { SiteContent } from './types';

/*
 * The website's built-in content. It is shown when Supabase isn't connected yet
 * (or can't be reached), and it matches supabase/seed.sql, which copies the same
 * content into the database. Once Supabase is connected, edit content in the
 * Admin Panel instead of here.
 */
const t = '2026-01-01T00:00:00Z';
const listed = (id: string, sort_order: number) => ({ id, sort_order, published: true, created_at: t, updated_at: t });

export const DEFAULT_CONTENT: SiteContent = {
  info: {
    id: 1,
    name: 'NPC Seventh-day Adventist Church',
    short_name: 'NPC SDA Church',
    denomination: 'Seventh-day Adventist',
    address: 'Blk 7 Lot 83 Binga St., Napocor Village, Brgy. Pasong Tamo, Quezon City, Philippines',
    map_query: 'Binga St, Napocor Village, Pasong Tamo, Quezon City',
    phone: '09123456789',
    email: 'npctsora.sdachurch1998@gmail.com',
    facebook_url: 'https://www.facebook.com/npcsdachurch1998',
    member_count: '150+', // placeholder
    founded_year: 1998,
    about_heading: 'A family of faith in Napocor Village',
    intro:
      "Since 1998, NPC Seventh-day Adventist Church has been a place where neighbors in Pasong Tamo come to study God's Word, worship together on the Sabbath, and serve our community with open hands.\n\nWhether you've been an Adventist all your life or you're just curious about faith, you belong here.",
    mission:
      'To make disciples of Jesus Christ who live as His loving witnesses and share the everlasting gospel with everyone, in preparation for His soon return.',
    vision:
      'A Christ-centered, Bible-believing church family that is a light to Quezon City through worship, fellowship, health, and service.',
    history: null,
  },

  services: [
    { ...listed('s1', 10), name: 'Midweek Prayer Meeting', day_of_week: 3, start_time: '19:00', end_time: '21:00', is_main: false },
    { ...listed('s2', 20), name: 'Vesper Service', day_of_week: 5, start_time: '19:00', end_time: '21:00', is_main: false },
    { ...listed('s3', 30), name: 'Sabbath School', day_of_week: 6, start_time: '08:30', end_time: '10:30', is_main: false },
    { ...listed('s4', 40), name: 'Divine Service', day_of_week: 6, start_time: '10:30', end_time: '12:00', is_main: true },
    { ...listed('s5', 50), name: 'Adventist Youth (AY)', day_of_week: 6, start_time: '14:00', end_time: '16:00', is_main: false },
  ],

  // placeholder events
  events: [
    {
      id: 'e1', kind: 'event', title: 'Week of Prayer', category: 'Evangelism',
      description: 'Nightly worship and messages of hope. Bring a friend!',
      starts_at: '2026-11-22T19:00:00+08:00', ends_at: '2026-11-29T21:00:00+08:00', schedule_note: 'Nightly, 7:00 PM',
      location: null, image_url: null, link_url: null, status: 'upcoming', is_featured: true, published: true,
    },
    {
      id: 'e2', kind: 'event', title: 'Health Expo & Free Check-ups', category: 'Community',
      description: 'Blood pressure, BMI, and healthy-cooking demo for the whole barangay.',
      starts_at: '2026-12-06T08:00:00+08:00', ends_at: '2026-12-06T12:00:00+08:00', schedule_note: null,
      location: null, image_url: null, link_url: null, status: 'upcoming', is_featured: false, published: true,
    },
    {
      id: 'e3', kind: 'event', title: 'Christmas Cantata', category: 'Music',
      description: "An evening of carols and the story of Christ's birth, presented by our choir and youth.",
      starts_at: '2026-12-20T18:00:00+08:00', ends_at: null, schedule_note: null,
      location: null, image_url: null, link_url: null, status: 'upcoming', is_featured: false, published: true,
    },
    {
      id: 'e4', kind: 'announcement', title: 'Baptismal class', category: null,
      description: 'Meets every Sabbath at 4:00 PM after AY. Talk to Pastor Jemuel to join.',
      starts_at: null, ends_at: null, schedule_note: null,
      location: null, image_url: null, link_url: null, status: 'ongoing', is_featured: false, published: true,
    },
  ],

  ministries: [
    ['Youth Ministry', 'Adventist Youth programs, Bible study, and outreach for young people.', 'users'],
    ['Pathfinders', 'Ages 10–15. Camping, honors, drills, and character building.', 'compass'],
    ['Adventurers', 'Ages 4–9. Fun, faith-filled activities for little ones and their families.', 'star'],
    ["Women's Ministry", 'Fellowship, prayer, and support for women in every season of life.', 'sparkle'],
    ['Music Ministry', 'Choir, praise team, and special music for worship.', 'music'],
    ['Health Ministry', 'Health talks, cooking classes, and wellness programs for our community.', 'activity'],
    ['Personal Ministries', 'Bible studies, evangelism, and sharing hope door to door.', 'megaphone'],
    ['Family & Community', 'Family life seminars, feeding programs, and disaster relief.', 'home'],
  ].map(([name, description, icon], i) => ({
    ...listed(`m${i + 1}`, (i + 1) * 10), name, description, icon, leader: null, schedule: null, image_url: null,
  })),

  // Officer names other than the pastor are placeholders
  officers: [
    ['Ptr. Jemuel Abcede', 'Church Pastor', true],
    [null, 'Head Elder', false],
    [null, 'Church Clerk', false],
    [null, 'Treasurer', false],
    [null, 'Head Deacon', false],
    [null, 'Head Deaconess', false],
    [null, 'Sabbath School Superintendent', false],
    [null, 'AY Leader', false],
  ].map(([full_name, position, is_featured], i) => ({
    ...listed(`o${i + 1}`, (i + 1) * 10),
    full_name: full_name as string | null, position: position as string, is_featured: is_featured as boolean, image_url: null, bio: null,
  })),

  milestones: [],

  albums: [
    { id: 'a1', name: 'Church building', description: null, sort_order: 10 },
    { id: 'a2', name: 'Worship', description: null, sort_order: 20 },
    { id: 'a3', name: 'Youth', description: null, sort_order: 30 },
    { id: 'a4', name: 'Community', description: null, sort_order: 40 },
  ],

  // Only the church image is a real photo; the rest are placeholder tiles
  photos: [
    ['a1', '/assets/church.jpg', 'Our church home', null],
    ['a2', null, 'Divine worship', 'church'],
    ['a2', null, 'Baptism', 'heart'],
    ['a3', null, 'Pathfinder Day', 'compass'],
    ['a3', null, 'Youth gathering', 'users'],
    ['a2', null, 'Choir', 'music'],
    ['a4', null, 'Health Expo', 'activity'],
    ['a4', null, 'Community outreach', 'home'],
    ['a2', null, 'Church family photo', 'camera'],
  ].map(([album_id, image_url, caption, icon], i) => ({
    ...listed(`p${i + 1}`, (i + 1) * 10), album_id, image_url, caption, icon, description: null,
  })),

  fund: {
    id: 1,
    title: 'Church Building Fund',
    description:
      "We're building a house of worship for the generations to come: a sanctuary with room to grow, classrooms for our children, and space to serve Napocor Village.",
    goal: 5000000, // placeholder
    raised: 1850000, // placeholder
    image_url: '/assets/church.jpg',
    image_caption: "Artist's rendering of our new sanctuary",
    form_url: null,
  },

  giving: {
    id: 1,
    note: 'Please note "Tithe", "Offering", or "Building Fund" on each gift, and message us a photo of your receipt so we can issue an official receipt.',
    form_url: null,
    form_label: 'Give online',
  },

  // placeholder account details
  givingMethods: [
    { ...listed('g1', 10), title: 'GCash', icon: 'phone2', bank_name: null, account_name: 'NPC SDA Church Treasurer', account_number: '0900 000 0000', note: null },
    { ...listed('g2', 20), title: 'Bank deposit', icon: 'bank', bank_name: 'Bank name', account_name: 'NPC Seventh-day Adventist Church', account_number: '0000-0000-00', note: null },
    { ...listed('g3', 30), title: 'In person', icon: 'church', bank_name: null, account_name: null, account_number: null, note: 'Use a tithe envelope during Sabbath worship, or hand it to our church treasurer.' },
  ],

  resources: [
    { ...listed('r1', 10), category: 'bible', title: 'Holy Bible', description: 'Read and search Scripture online in English, Tagalog, and many other versions.', url: 'https://www.biblegateway.com/', image_url: null },
    { ...listed('r2', 20), category: 'sabbath_school', title: 'Sabbath School Lessons', description: "This quarter's Adult Bible Study Guide, with a daily lesson to prepare for Sabbath.", url: 'https://www.sabbath.school/', image_url: null },
    { ...listed('r3', 30), category: 'devotional', title: 'Daily Devotionals', description: 'Start each morning with daily devotional readings and the writings of Ellen G. White.', url: 'https://egwwritings.org/', image_url: null },
    { ...listed('r4', 40), category: 'prayer', title: 'Prayer Requests', description: "Our prayer team would be honored to pray with you. Share what's on your heart.", url: '#prayer', image_url: null },
  ],
};
