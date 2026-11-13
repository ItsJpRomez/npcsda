# NPC Seventh-day Adventist Church website

Website and Admin Panel for NPC (Napocor) Seventh-day Adventist Church, Pasong Tamo, Quezon City.

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (database, sign-in, photo storage), hosted on Vercel.
- **Admin Panel:** `/admin`. Church administrators edit events, photos, officers, ministries, schedules, church details, the building fund and giving information. Changes appear on the site as soon as they're saved.

## Quick start

```bash
npm install
cp .env.example .env.local   # then add your Supabase URL and anon key
npm run dev                  # http://localhost:3000
```

Without Supabase values, the site runs on its built-in content (`lib/default-content.ts`), and `/admin` explains how to connect it.

Full setup (Supabase, first administrator, Vercel): see [ADMIN-SETUP.md](ADMIN-SETUP.md).

## Project layout

```
app/(site)/          public home page + its styles
app/admin/           Admin Panel: login, dashboard and one page per section
components/site/     public page sections (server) and interactive bits (client)
components/admin/    Admin Panel UI: lists, forms, gallery manager, dashboard
lib/                 types, built-in content, formatting, Supabase clients, data loading
proxy.ts             keeps /admin behind sign-in
supabase/            schema.sql (tables + security rules) and seed.sql (starting content)
public/assets/       logo and church images
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Production build (also type-checks) |
| `npm run start` | Run the production build |
| `npm run typecheck` | Type-check without building |
