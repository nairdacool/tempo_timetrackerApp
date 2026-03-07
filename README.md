# Tempo — Time Tracking App

A full-stack time tracking web application built with React, TypeScript, and Supabase. Track hours, manage projects, generate reports, and handle timesheet approvals — all in a clean, modern interface with automatic dark/light mode.

**Live Demo:** [https://tempo-timetracker.vercel.app/](https://tempo-timetracker.vercel.app/)

---

## Screenshots

> Dashboard · Timesheet · Projects · Reports · Approvals · Team · Settings

---

## Features

- **Authentication** — Email/password login, signup, forgot password reset, and team invite flow via Supabase Auth
- **Dashboard** — Live stats (week hours, month hours, active projects, pending approvals), recent entries, week summary chart and quick actions. Admins see org-wide team totals; members see their own personal stats
- **Timesheet** — Log time entries by project, navigate weeks, submit for approval. Entries update live when an admin approves or rejects them
- **Timer** — Persistent floating timer widget with project and note fields. Survives page refreshes via `localStorage`
- **Projects** — Create and manage projects with client, color, budget tracking, progress bars, and billable flag. Soft-delete support. Toggle between Grid and By Client grouped view
- **Clients** — First-class `clients` table. Project modals have a client dropdown with inline new-client creation. Reports include a By Client tab (admin) and detailed exports include a Client column
- **Reports** — Visualize hours by week/month/custom range, project breakdown table. Admins see org-wide data across all members with By Project, By Member, and By Client tabs. Export to CSV and PDF (detail report includes Member, Project, Client, Description, Hours)
- **Approvals** — Admin workflow: view submitted timesheets, approve or reject with an optional reason. Supports resubmission after rejection. Status updates use a `SECURITY DEFINER` RPC to reliably update all matching entries regardless of RLS row visibility
- **Team** — Invite members by email (Supabase invite + Resend email), edit roles/name/initials/avatar color, deactivate/reactivate accounts, sort and filter
- **Organizations** — Multi-org support; admins can manage their organization
- **In-app notifications** — Toast notifications when a user's timesheet is approved or rejected, powered by polling (works on any page)
- **Settings** — Users can update their name, initials, avatar color (12 presets + custom picker), and change their password
- **URL persistence** — Refreshing the app keeps the user on the same page. Admin-only routes hold the loading screen until the profile resolves so the admin guard never incorrectly redirects
- **Adaptive theme** — Automatic dark/light mode via `prefers-color-scheme`. All colors are CSS variables
- **Mobile layout** — Responsive design with a bottom navigation bar on small screens. Fully usable on phone

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Build tool | Vite |
| Styling | CSS variables + Tailwind CSS v4 |
| Backend / Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Email | Resend (via Supabase Edge Function) |
| PDF export | jsPDF + jspdf-autotable |
| Toasts | react-hot-toast |
| Deployment | Vercel |
| Fonts | DM Serif Display + DM Sans (Google Fonts) |

---

## Project Structure

```
src/
├── context/
│   ├── AuthContext.tsx        # Auth provider — session, profile, refreshProfile
│   ├── AuthContextInstance.ts # Default context value
│   └── useAuth.ts             # Hook for consuming auth state
├── hooks/
│   ├── useDashboard.ts        # Dashboard stats fetching
│   ├── useProjects.ts         # Projects CRUD
│   ├── useTimeEntries.ts      # Time entries by week + 8s polling for live updates
│   ├── useReports.ts          # Aggregated report data
│   ├── useApprovals.ts        # Approvals with optimistic updates
│   ├── useTeam.ts             # Team members CRUD
│   └── useBreakpoint.ts       # Responsive breakpoint detection
├── lib/
│   ├── supabase.ts            # Supabase client (anon key only)
│   ├── queries.ts             # All database query functions
│   ├── exportCsv.ts           # CSV export helper
│   └── exportPdf.ts           # PDF export (summary + detail with Client column)
├── components/
│   ├── layout/
│   │   ├── Layout.tsx         # App shell with topbar + page routing
│   │   ├── Sidebar.tsx        # Desktop nav with pending badge, profile link
│   │   └── BottomNav.tsx      # Mobile bottom navigation
│   └── ui/
│       ├── StatCard.tsx
│       ├── TimerWidget.tsx    # Persistent floating timer
│       ├── WeekNavigator.tsx
│       ├── WeekSummary.tsx
│       ├── RecentEntries.tsx
│       ├── EntryForm.tsx
│       ├── DayGroup.tsx       # Entry list per day with status badges + rejection tooltip
│       ├── TimeEntryModal.tsx # Add / edit entry modal
│       ├── ProjectCard.tsx
│       ├── NewProjectModal.tsx
│       ├── EditProjectModal.tsx
│       ├── HoursChart.tsx
│       ├── ProjectBreakdownTable.tsx
│       ├── ProjectsBreakdown.tsx
│       ├── PeriodFilter.tsx
│       ├── ApprovalCard.tsx   # Approval row with resubmitted badge
│       ├── MemberCard.tsx
│       ├── InviteMemberModal.tsx
│       └── EditMemberModal.tsx
├── pages/
│   ├── Login.tsx              # Login / signup / forgot password
│   ├── SetPassword.tsx        # Invite accept — set initial password
│   ├── Dashboard.tsx
│   ├── Timesheet.tsx
│   ├── Projects.tsx
│   ├── Reports.tsx
│   ├── Approvals.tsx
│   ├── Team.tsx
│   ├── Organizations.tsx
│   └── Settings.tsx           # Profile (name, avatar color) + password change
├── types.ts                   # Shared TypeScript interfaces
├── App.tsx                    # Root with auth-protected routing + notification polling
└── index.css                  # Design tokens + global styles
supabase/
├── functions/
│   └── invite-member/         # Edge Function — sends invite email via Resend
│       └── index.ts
├── migrations/                # Incremental DB migrations (apply after initial schema)
│   ├── 20260305000000_protect_approved_entries.sql
│   ├── 20260306000000_approvals_rejection_reason.sql
│   ├── 20260306000001_projects_billable.sql
│   ├── 20260307000001_clients_table.sql
│   ├── 20260307000003_update_approval_status_fn.sql
│   └── 20260307000004_admin_select_time_entries.sql
└── scripts/
    ├── reset_data.sql         # Wipes all app data for automation testing
    └── seed_test_data.sql     # Seeds consistent baseline test data
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone https://github.com/nairdacool/tempo_timetrackerApp.git
cd tempo_timetrackerApp/tempo
npm install
```

### 2. Set up Supabase

Create a new Supabase project, then run the following SQL in the **SQL Editor**:

```sql
-- Extensions
create extension if not exists "uuid-ossp";

-- ORGANIZATIONS
create table organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- PROFILES
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  initials text not null,
  role text not null default 'Developer',
  color text not null default '#c8602a',
  organization_id uuid references organizations(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- PROJECTS
create table projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  client text not null default 'Internal',
  color text not null default '#c8602a',
  budget_hours integer not null default 80,
  status text not null default 'active',
  billable boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- PROJECT MEMBERS
create table project_members (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  unique (project_id, user_id)
);

-- TIME ENTRIES
create table time_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  project_id uuid references projects(id) on delete cascade not null,
  description text not null default '',
  date date not null,
  start_time time not null,
  end_time time not null,
  duration_minutes integer not null,
  status text not null default 'draft',
  created_at timestamptz default now()
);

-- APPROVALS
create table approvals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  reviewer_id uuid references profiles(id) on delete set null,
  week_start date not null,
  week_end date not null,
  total_hours numeric not null default 0,
  status text not null default 'pending',
  rejection_reason text,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz
);

-- ROW LEVEL SECURITY
alter table organizations  enable row level security;
alter table profiles       enable row level security;
alter table projects       enable row level security;
alter table project_members enable row level security;
alter table time_entries   enable row level security;
alter table approvals      enable row level security;

-- PROFILES policies
create policy "Authenticated users can read profiles"
  on profiles for select using (auth.role() = 'authenticated');
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Admins can update all profiles"
  on profiles for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'Admin')
  );
create policy "Admins can update organization_id on any profile"
  on profiles for update using (
    exists (select 1 from profiles me where me.id = auth.uid() and me.role = 'Admin')
  );

-- ORGANIZATIONS policies
create policy "Members can view their org"
  on organizations for select using (
    id in (select organization_id from profiles where id = auth.uid())
  );
create policy "Admins full access to organizations"
  on organizations for all using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Admin')
  );

-- PROJECTS policies
create policy "Projects viewable by authenticated users"
  on projects for select using (auth.role() = 'authenticated');
create policy "Authenticated users can create projects"
  on projects for insert with check (auth.role() = 'authenticated');
create policy "Admins can update projects"
  on projects for update using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Admin')
  );
create policy "Users can read assigned projects"
  on projects for select using (
    exists (
      select 1 from project_members
      where project_members.project_id = projects.id
        and project_members.user_id = auth.uid()
    )
  );

-- PROJECT MEMBERS policies
create policy "Users can read own project memberships"
  on project_members for select using (auth.uid() = user_id);
create policy "Admins can read all project memberships"
  on project_members for select using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Admin')
  );
create policy "Admins can insert project memberships"
  on project_members for insert with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Admin')
  );
create policy "Admins can delete project memberships"
  on project_members for delete using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Admin')
  );

-- TIME ENTRIES policies
create policy "Users can view own time entries"
  on time_entries for select using (auth.uid() = user_id);
create policy "Admins can read all time entries"
  on time_entries for select using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Admin')
  );
create policy "Users can insert own time entries"
  on time_entries for insert with check (auth.uid() = user_id);
create policy "Admins can update all time entries"
  on time_entries for update using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Admin')
  );
create policy "users_cannot_edit_approved_entries"
  on time_entries for update using (
    (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Admin'))
    or (user_id = auth.uid() and status <> 'approved')
  );
create policy "users_cannot_delete_approved_entries"
  on time_entries for delete using (
    (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Admin'))
    or (user_id = auth.uid() and status <> 'approved')
  );

-- APPROVALS policies
create policy "Users can view own approvals"
  on approvals for select using (auth.uid() = user_id);
create policy "Users can insert own approvals"
  on approvals for insert with check (auth.uid() = user_id);
create policy "Users can update own approvals"
  on approvals for update using (auth.uid() = user_id)
  with check (status = 'pending');
create policy "Admins can read all approvals"
  on approvals for select using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Admin')
  );
create policy "Admins can update all approvals"
  on approvals for update using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Admin')
  );

-- AUTO-CREATE PROFILE ON SIGNUP
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  org_id uuid;
  org_name text;
begin
  org_name := coalesce(new.raw_user_meta_data->>'organization', '');
  if org_name <> '' then
    insert into organizations (name) values (org_name) returning id into org_id;
  end if;

  insert into profiles (id, full_name, initials, role, color, organization_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'initials',  'NU'),
    coalesce(new.raw_user_meta_data->>'role',       'Developer'),
    coalesce(new.raw_user_meta_data->>'color',      '#c8602a'),
    org_id
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

### 3. Apply database migrations

After running the initial schema above, apply the migrations in `supabase/migrations/` in order:

```bash
# Via Supabase CLI:
supabase db push
# Or paste each file's contents into the Supabase SQL Editor manually.
```

| File | What it does |
|---|---|
| `20260305000000_protect_approved_entries.sql` | RLS policies preventing non-admins from editing or deleting approved entries |
| `20260306000000_approvals_rejection_reason.sql` | Adds `rejection_reason TEXT` column to `approvals` |
| `20260306000001_projects_billable.sql` | Adds `billable BOOLEAN DEFAULT TRUE` column to `projects` |
| `20260307000001_clients_table.sql` | Creates `clients` table, RLS policies, migrates existing `projects.client` text values to FK rows, adds `client_id` FK column to `projects` |
| `20260307000003_update_approval_status_fn.sql` | Creates `update_approval_status` SECURITY DEFINER RPC — atomically updates `approvals` + `time_entries` bypassing RLS so admin approvals reliably propagate |
| `20260307000004_admin_select_time_entries.sql` | Adds admin bypass to the `time_entries` SELECT policy so admins can read all entries (required for org-wide reports and dashboard) |

All migrations use `IF NOT EXISTS` guards so they are safe to re-run against an existing database.

### 4. Configure environment variables

Create a `.env.local` file in `tempo/`:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Find these in your Supabase dashboard under **Project Settings → API**.

### 5. (Optional) Set up the invite email Edge Function

The invite flow uses a Supabase Edge Function backed by [Resend](https://resend.com) for transactional email.

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli)
2. Set the Resend API key as a Supabase secret:
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_key
   ```
3. Deploy the function:
   ```bash
   supabase functions deploy invite-member
   ```

If you skip this step, the invite button will still create Supabase Auth users — they just won't receive an email.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign up for the first account (automatically granted Admin role).

---

## Deployment

Configured for zero-config deployment on Vercel.

1. Push your repository to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new), set the **Root Directory** to `tempo`
3. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**

### Post-deployment: Supabase auth settings

In your Supabase dashboard go to **Authentication → URL Configuration**:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** `https://your-app.vercel.app/**`

---

## Key Design Decisions

**Single service layer** — all Supabase queries live in `src/lib/queries.ts`. Components never touch the Supabase client directly, making the codebase easy to maintain and test.

**Custom hooks per page** — each page has a dedicated hook (`useProjects`, `useTimeEntries`, etc.) handling loading, error, and data state. Pages stay declarative.

**Polling over Supabase Realtime** — live updates (entry status changes, admin pending count, approval notifications) use `setInterval` polling rather than `postgres_changes` subscriptions. This avoids the `REPLICA IDENTITY FULL` and RLS publication requirements that cause silent delivery failures, and works reliably with any RLS configuration. `weekDates` is memoized in `Timesheet` so the polling interval is stable and never restarted unnecessarily.

**Optimistic updates** — approval status changes update the UI instantly before the DB confirms, with rollback on failure.

**SECURITY DEFINER RPC for approval status** — `updateApprovalStatus` calls `supabase.rpc('update_approval_status')` rather than doing multi-step client-side updates. The RLS SELECT policy (which gates rows visible to UPDATE) blocked admins from updating other users' entries. The server-side function bypasses RLS while still validating the caller is an Admin.

**Admin-aware data fetching** — the admin `isAdmin` flag is derived from `profile`, which is fetched asynchronously after the session resolves. All hooks that branch on `isAdmin` wait for `profile !== null` before making their initial fetch, preventing the stale-`false` first fetch that would return the wrong (personal-only) dataset.

**CSS variables for theming** — all colors, spacing, and typography are CSS custom properties in `index.css`. Dark/light mode uses `prefers-color-scheme` — no JS required.

**Strict RLS** — every table has Row Level Security enabled. Users can only access their own data. Admins have explicit policies granting broader access. Frontend role checks are UI-only conveniences; the database enforces all real security.

**Anon key only** — the `service_role` key is never used or exposed in the frontend. All privileged operations (invite, admin updates) go through RLS-backed queries or Edge Functions.

---

## License

MIT
