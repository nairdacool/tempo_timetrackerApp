# Tempo — Time Tracking App

A full-stack time tracking web application built with React, TypeScript, and Supabase. Track hours, manage projects, generate reports, and handle timesheet approvals — all in a clean, modern interface.

**Live Demo:** [https://tempo-timetracker.vercel.app/](https://tempo-timetracker.vercel.app/)

---

## Screenshots

> Dashboard · Timesheet · Projects · Reports · Approvals · Team

---

## Features

- **Authentication** — Secure email/password login and signup via Supabase Auth
- **Dashboard** — Live stats, recent entries, week summary bars and quick actions
- **Timesheet** — Log time entries by project, navigate weeks, submit for approval
- **Projects** — Create and manage projects with budget tracking and progress bars
- **Reports** — Visualize hours by week and project across custom date ranges
- **Approvals** — Two-click approve/reject workflow with status cascading to entries
- **Team** — Member management with invite flow and activity stats
- **Dark mode** — Full dark theme via CSS variables with `prefers-color-scheme` support

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 + CSS variables |
| Backend / Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Deployment | Vercel |
| Fonts | DM Serif Display + DM Sans (Google Fonts) |

---

## Project Structure

```
src/
├── context/
│   ├── AuthContext.tsx       # Auth provider with session management
│   └── useAuth.ts            # Custom hook for auth state
├── hooks/
│   ├── useDashboard.ts       # Dashboard data fetching
│   ├── useProjects.ts        # Projects CRUD
│   ├── useTimeEntries.ts     # Time entries by week
│   ├── useReports.ts         # Aggregated report data
│   └── useApprovals.ts       # Approvals with optimistic updates
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── queries.ts            # All database query functions
├── components/
│   ├── layout/
│   │   ├── Layout.tsx        # App shell with topbar
│   │   └── Sidebar.tsx       # Navigation with badge counter
│   └── ui/
│       ├── StatCard.tsx
│       ├── TimerWidget.tsx
│       ├── WeekNavigator.tsx
│       ├── EntryForm.tsx
│       ├── DayGroup.tsx
│       ├── ProjectCard.tsx
│       ├── NewProjectModal.tsx
│       ├── HoursChart.tsx
│       ├── ProjectBreakdownTable.tsx
│       ├── PeriodFilter.tsx
│       ├── ApprovalCard.tsx
│       ├── MemberCard.tsx
│       └── InviteMemberModal.tsx
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Timesheet.tsx
│   ├── Projects.tsx
│   ├── Reports.tsx
│   ├── Approvals.tsx
│   └── Team.tsx
├── data/                     # Mock data (used as fallback / seeding reference)
├── types.ts                  # Shared TypeScript interfaces
├── App.tsx                   # Root with auth-protected routing
└── index.css                 # Design tokens + Tailwind import
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account

### 1. Clone the repository

```bash
git clone https://github.com/your-username/tempo.git
cd tempo
npm install
```

### 2. Set up Supabase

Create a new Supabase project, then run the following SQL in the **SQL Editor** to create all tables, policies, and triggers:

```sql
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- PROFILES
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  initials text not null,
  role text not null default 'Developer',
  color text not null default '#c8602a',
  organization text not null default 'Acme Corp',
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
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
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
  submitted_at timestamptz default now(),
  reviewed_at timestamptz
);

-- ROW LEVEL SECURITY
alter table profiles     enable row level security;
alter table projects     enable row level security;
alter table time_entries enable row level security;
alter table approvals    enable row level security;

-- POLICIES
create policy "Profiles are viewable by all users"
  on profiles for select using (auth.role() = 'authenticated');
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Projects viewable by authenticated users"
  on projects for select using (auth.role() = 'authenticated');
create policy "Authenticated users can create projects"
  on projects for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update projects"
  on projects for update using (auth.role() = 'authenticated');

create policy "Users can view own time entries"
  on time_entries for select using (auth.uid() = user_id);
create policy "Users can insert own time entries"
  on time_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own time entries"
  on time_entries for update using (auth.uid() = user_id);
create policy "Users can delete own time entries"
  on time_entries for delete using (auth.uid() = user_id);

create policy "Users can view own approvals"
  on approvals for select using (auth.uid() = user_id);
create policy "Users can insert own approvals"
  on approvals for insert with check (auth.uid() = user_id);
create policy "Users can update own approvals"
  on approvals for update using (auth.uid() = user_id);

-- AUTO-CREATE PROFILE ON SIGNUP
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, initials, role, color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'initials', 'NU'),
    coalesce(new.raw_user_meta_data->>'role', 'Developer'),
    coalesce(new.raw_user_meta_data->>'color', '#c8602a')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

Optionally seed some starter projects:

```sql
insert into projects (name, client, color, budget_hours, status) values
  ('Acme Website Redesign', 'Acme Corporation', '#c8602a', 80,  'active'),
  ('Backend API v2',        'Internal',         '#2a5fa8', 120, 'active'),
  ('Mobile App',            'TechStart Inc.',   '#2a7a4f', 200, 'active'),
  ('Data Pipeline',         'Internal',         '#c87d2a', 60,  'on-hold');
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Find these values in your Supabase dashboard under **Project Settings → API**.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign up for an account.

---

## Deployment

This project is configured for zero-config deployment on Vercel.

### Deploy to Vercel

1. Push your repository to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Vercel will auto-detect Vite — no build settings needed
4. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables
5. Click **Deploy**

### Post-deployment: update Supabase auth settings

In your Supabase dashboard go to **Authentication → URL Configuration** and add your Vercel URL:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** `https://your-app.vercel.app/**`

This ensures email confirmation links work correctly on the live site.

---

## Key Design Decisions

**Service layer pattern** — all Supabase queries live in `src/lib/queries.ts`, keeping components clean and making future changes easy to manage in one place.

**Custom hooks** — each page has a dedicated hook (`useProjects`, `useTimeEntries`, etc.) that handles loading, error, and data state. Components just consume data without caring where it comes from.

**Optimistic updates** — approval status changes update the UI instantly before the database confirms, giving a snappy feel while still rolling back on failure.

**CSS variables for theming** — all colors are defined as custom properties in `index.css`, making dark mode and future theme changes a single-file edit.

**Row Level Security** — users can only read and write their own data. The RLS policies are enforced at the database level, not just the application level.

---

## Roadmap

- [ ] React Router for proper URL-based navigation
- [ ] Responsive / mobile layout
- [ ] Export to CSV and PDF (real implementation)
- [ ] Team admin role — managers can view and approve all team members' timesheets
- [ ] Recurring time entries
- [ ] Notifications for approval status changes
- [ ] Project tags and custom fields

---

## License

MIT