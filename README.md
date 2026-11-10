# TaskBoard

A team task-planning web app: plans, buckets, task cards, Board / Grid / Calendar / Timeline / Charts views, My tasks, an Admin console, English and Arabic (right-to-left), and installable as an app on phones and computers.

It runs on any web host. Data, sign-in and live updates come from **Supabase** (free tier is enough to start). The database enforces every role, so people only receive the plans and tasks they're allowed to see.

> النسخة العربية من هذا الدليل: [README.ar.md](README.ar.md)

---

## What you need

- A free **Supabase** account: https://supabase.com
- One of: a **Bolt** account (https://bolt.new), or any static host (Netlify, Vercel, Cloudflare Pages), or Node.js 18+ on your computer.

## 1. Create the database (5 minutes)

1. In Supabase, create a **New project**. Choose a region close to your users and keep the database password somewhere safe.
2. Open **SQL Editor → New query**.
3. Open `supabase/migrations/20261110000000_taskboard.sql` from this project, copy all of it, paste it, and press **Run**. It's safe to run again later.
4. Open **Project Settings → API** (or the **Connect** button) and copy:
   - the **Project URL**
   - the **anon / publishable key** (never use the `service_role` / secret key in this app)

## 2. Set up sign-in

In Supabase, open **Authentication → URL Configuration**:

- **Site URL**: the address where you'll host the app (for example `https://taskboard.example.com`).
- **Redirect URLs**: add the same address. While testing, also add your Bolt preview or `http://localhost:5173`.

Email confirmation is on by default: new users get a confirmation email before they can sign in. You can change this under **Authentication → Providers → Email**.

## 3a. Run it on Bolt

1. Put this project in a GitHub repository (create a new repository and upload these files).
2. In Bolt, import it from GitHub. From the Bolt home page choose GitHub and pick the repository, or put `bolt.new/` in front of the repository address, e.g. `https://bolt.new/github.com/YOUR-USER/YOUR-REPO`.
3. Connect Supabase: in the project, click the **Database** icon → **Advanced** → **Connect**, and choose the Supabase project from step 1.
4. If Bolt doesn't fill them in, add the two settings from `.env.example` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the project's environment settings or a `.env` file.
5. Click **Publish** / **Deploy**. Add the published address to Supabase's Site URL and Redirect URLs (step 2).

## 3b. Run it anywhere else

```bash
cp .env.example .env        # then paste your Supabase URL and key into .env
npm install
npm run dev                 # local test at http://localhost:5173
npm run build               # production files go to dist/
```

Upload the `dist/` folder to any static host. On Netlify, Vercel or Cloudflare Pages, connect the GitHub repository, set the build command to `npm run build` and the output folder to `dist`, and add the two `VITE_SUPABASE_…` environment variables.

## 4. First sign-in

1. Open the site and **Create account**. **The first account becomes the Owner** (a permanent admin).
2. Send the site's address to your team. Each person creates an account and appears in **Admin console → Users → Waiting for approval**.
3. Approve them, choose a role, and add them to plans.

| Role | What they can do |
|---|---|
| Owner | Everything an admin can do. Can't be changed. |
| Admin | Create and delete plans, manage members, buckets, labels and roles, see every plan. |
| Member | Add, edit, assign, move and complete tasks in the plans they belong to. Delete tasks they created. |
| Viewer | Read and export the plans they belong to. |
| Pending | New account waiting for approval. Sees nothing. |
| No access | Blocked. Sees nothing; their history stays. |

## 5. Install as an app

The app is a Progressive Web App. Once it's hosted on HTTPS:

- **Computer (Chrome / Edge)**: click **Install app** in the sidebar, or the install icon in the address bar.
- **Android (Chrome)**: tap **Install app** in the sidebar, or menu → **Install app**.
- **iPhone / iPad (Safari)**: tap **Share → Add to Home Screen**. The sidebar button shows these steps.

It then opens in its own window with its own icon. The app's screens load even on a weak connection; saving changes needs a connection.

## Customizing

- **Arabic text**: `src/i18n.js` (English text → Arabic). Text people type is never translated.
- **Colors and fonts**: the variables at the top of `src/styles.css`.
- **Plan templates, label colors**: the constants at the top of `src/main.js`.
- **App name and icon**: `index.html`, `public/manifest.webmanifest`, `public/icons/`.

## Project layout

```
index.html                     page shell
src/main.js                    the app (views, admin, events)
src/backend.js                 all Supabase calls (auth, data, live updates)
src/i18n.js                    Arabic translations
src/styles.css                 design
public/manifest.webmanifest    app install settings
public/sw.js                   offline/app-shell cache (production builds only)
supabase/migrations/…sql       database tables, security rules, live updates
```

## Security notes

- The anon/publishable key is meant to be public. The database's Row Level Security rules decide what each signed-in person can read or change. These rules were tested for every role.
- Never put the `service_role` / secret key in this app or in Bolt's front-end settings.
- To remove someone completely, set them to **No access** in the app, or delete the user in Supabase → Authentication → Users.
