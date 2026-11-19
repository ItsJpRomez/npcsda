/* Icons for the whole site: Tabler outline icons (stroke 1.75).
   <Icon name="calendar" /> keeps working with the names stored in the database
   (ministries, giving methods), which came from the original icon set. */
import {
  IconActivity, IconAlertCircle, IconArrowRight, IconArrowUp, IconArrowUpRight, IconBell, IconBook, IconBrandFacebook,
  IconBuildingBank, IconBuildingChurch, IconCalendar, IconCalendarEvent, IconCalendarPlus, IconCalendarTime, IconCamera,
  IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronUp, IconClock, IconCompass, IconCopy,
  IconDeviceMobile, IconDroplet, IconExternalLink, IconEye, IconFolder, IconGift, IconHeart, IconHeartbeat,
  IconHeartHandshake, IconHelpCircle, IconHistory, IconHome, IconHomeHeart, IconInfoCircle, IconLayoutDashboard,
  IconLayoutGrid, IconLink, IconLogout, IconMail, IconMap, IconMap2, IconMapPin, IconMenu2, IconMoon, IconMusic,
  IconPencil, IconPhone, IconPhoto, IconPhotoUp, IconGripVertical, IconPlayerPause, IconPlayerPlay, IconPlus, IconQuote, IconSearch, IconSend, IconSparkles,
  IconSpeakerphone, IconStar, IconSun, IconTargetArrow, IconTrash, IconUpload, IconUser, IconUserEdit, IconUsers,
  IconWorld, IconX,
  type Icon as TablerIcon,
} from '@tabler/icons-react';

const ICONS: Record<string, TablerIcon> = {
  // interface
  dashboard: IconLayoutDashboard, info: IconInfoCircle, clock: IconClock, history: IconHistory, user: IconUser,
  'calendar-event': IconCalendarEvent, 'calendar-time': IconCalendarTime, users: IconUsers, camera: IconCamera, book: IconBook,
  church: IconBuildingChurch, gift: IconGift, 'chevron-left': IconChevronLeft, 'chevron-down': IconChevronDown,
  chevron: IconChevronRight, logout: IconLogout, search: IconSearch, help: IconHelpCircle, bell: IconBell,
  external: IconExternalLink, 'arrow-up-right': IconArrowUpRight, 'arrow-up': IconArrowUp, calendar: IconCalendar,
  grid: IconLayoutGrid, 'calendar-plus': IconCalendarPlus, 'photo-up': IconPhotoUp, 'user-edit': IconUserEdit, link: IconLink,
  plus: IconPlus, x: IconX, upload: IconUpload, trash: IconTrash, edit: IconPencil, up: IconChevronUp, down: IconChevronDown,
  image: IconPhoto, alert: IconAlertCircle, check: IconCheck, folder: IconFolder, menu: IconMenu2,
  'heart-handshake': IconHeartHandshake, 'map-2': IconMap2, target: IconTargetArrow, eye: IconEye, world: IconWorld,
  heartbeat: IconHeartbeat, 'home-heart': IconHomeHeart, droplet: IconDroplet,
  // names stored with website content
  phone2: IconDeviceMobile, pin: IconMapPin, phone: IconPhone, mail: IconMail, facebook: IconBrandFacebook,
  heart: IconHeart, music: IconMusic, sun: IconSun, moon: IconMoon, compass: IconCompass, star: IconStar,
  activity: IconActivity, megaphone: IconSpeakerphone, sparkle: IconSparkles, home: IconHome, arrow: IconArrowRight,
  bank: IconBuildingBank, copy: IconCopy, send: IconSend, map: IconMap, play: IconPlayerPlay, pause: IconPlayerPause, quote: IconQuote, grip: IconGripVertical,
};

export function Icon({ name, className = 'icon', size, px }: { name: string; className?: string; size?: 'sm'; px?: number }) {
  const Glyph = ICONS[name] ?? IconPhoto;
  return <Glyph className={size ? `${className} ${size}` : className} size={px ?? (size === 'sm' ? 16 : 20)} stroke={1.75} aria-hidden="true" />;
}
