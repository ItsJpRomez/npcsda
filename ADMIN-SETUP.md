# Setup: Supabase, Vercel and the Admin Panel

The website is a **Next.js + TypeScript** app. Church administrators update it through the **Admin Panel** at `/admin`. They can manage events, photos, officers, ministries, church details, the building fund and more. Changes appear on the website as soon as they click **Save**, with no code editing or redeploying.

- **Supabase** (free tier is enough) stores the content, the administrator accounts and the uploaded photos.
- **Vercel** (free tier) hosts the site and rebuilds it automatically whenever you push to GitHub.

Until Supabase is connected, the site shows its built-in content from `lib/default-content.ts`.

---

## 1. Create the Supabase project

1. Go to <https://supabase.com>, sign up, and click **New project**.
2. Name it, for example `npc-sda-church`.
3. Choose a strong database password and keep it somewhere safe.
4. For the region, pick **Southeast Asia (Singapore)**.
5. Wait about a minute for the project to finish setting up.

## 2. Create the tables and copy in the current content

1. In your project, open **SQL Editor** → **New query**.
2. Open [`supabase/schema.sql`](supabase/schema.sql), copy everything, paste it in, and click **Run**.
   - This creates the tables, the security rules, and the `media` photo storage.
3. Start another **New query**. Paste in [`supabase/seed.sql`](supabase/seed.sql) and click **Run**.
   - This copies the website's current content into the database, so nothing is lost.
   - It's safe to run again later: it only fills tables that are still empty.

## 3. Lock down sign-ups

In **Authentication** → **Sign In / Providers**, turn **off** "Allow new users to sign up". Only people you add yourself should have accounts.

## 4. Add the first administrator

1. Go to **Authentication** → **Users** → **Add user** → **Create new user**.
2. Enter the administrator's email and a password, tick **Auto Confirm User**, and click **Create user**.
3. In **SQL Editor**, run this, using the same email:

   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users where email = 'admin@example.com'
   on conflict do nothing;
   ```

Only accounts listed in `admin_users` can change content or upload photos. Anyone else who signs in is turned away.

- **To add another administrator:** repeat steps 1–3 with their email.
- **To remove one:** run this, then delete the user under **Authentication → Users**.

  ```sql
  delete from public.admin_users where email = 'person@example.com';
  ```

## 5. Deploy to Vercel

1. Go to <https://vercel.com>, sign in with GitHub, and click **Add New → Project**.
2. Import the `npcsda` repository. Vercel detects Next.js on its own, so leave the build settings as they are.
3. Under **Environment Variables**, add the two values from Supabase:

   | Name | Where to find it in Supabase |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | **Project Settings → Data API** → Project URL, for example `https://abcdefgh.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Project Settings → API Keys** → **Legacy API keys** tab → `anon` `public` |

4. Click **Deploy**. You get an address like `https://npcsda.vercel.app`. You can add your own domain later under **Settings → Domains**.
5. Back in Supabase, open **Authentication → URL Configuration**:
   - Set **Site URL** to your Vercel address.
   - Add `https://YOUR-SITE/admin/auth/callback` under **Redirect URLs**.
   - The "Forgot your password?" email link needs this.

> **Never** add the `service_role` key to this project or to Vercel. The anon key is designed to be public. The security rules in `schema.sql` mean it can only *read* published content. Only a signed-in administrator can change anything.

## 6. Sign in

Open `https://YOUR-SITE/admin` and sign in with the administrator account.

---

## Working on the site on your computer

You need Node.js 20.9 or newer.

1. Copy `.env.example` to `.env.local` and fill in the same two values.
2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

3. Open <http://localhost:3000>. The Admin Panel is at <http://localhost:3000/admin>.

To check the code, run `npm run typecheck` or `npm run build`.

## How it works

| Piece | Where | What it does |
|---|---|---|
| Public website | `app/(site)/`, `components/site/` | Built on the server from the content in Supabase. Each section falls back to the built-in content if its data can't be loaded. |
| Speed + freshness | `app/(site)/page.tsx`, `app/admin/actions.ts` | The home page is cached so it loads fast. Every Save in the Admin Panel rebuilds it right away, and it also refreshes on its own every 5 minutes. |
| Admin Panel | `app/admin/`, `components/admin/` | Sign in, dashboard, and a form for every section. Photos upload straight to Supabase Storage. |
| Sign-in protection | `proxy.ts`, `app/admin/(panel)/layout.tsx` | The server sends anyone who isn't signed in to the login page, and anyone not in `admin_users` is turned away before any admin page loads. |
| Data security | `supabase/schema.sql` | Row Level Security: visitors can only read published items; only administrators can add, edit or delete content and photos. |
| Photos | Supabase Storage, `media` bucket | JPG, PNG or WebP, up to 5 MB each, enforced by Supabase itself. Replacing or deleting a photo also deletes the old file. |
| Donations | Google Forms | The website never handles payments. Paste your Google Form link under **Building fund** (and optionally under **Tithes & offerings**). |

## Good to know

- **Free-tier pause:** Supabase pauses free projects after a week with no activity. Normal visitor traffic keeps it awake. If it ever pauses, click **Restore** in the dashboard. Meanwhile, the site shows its built-in content.
- **Backups:** the free tier has no automatic backups. Every few months, export the important tables from **Table Editor** (each table → **Export → CSV**).
- **Events disappear on their own:** an event leaves the website once its end date has passed or you mark it **Completed**.
- **Placeholder content:** the officer names, GCash and bank details, member count, fund amounts and events are still placeholder values. Update them in the Admin Panel.
