# MP Kanban Board

A Next.js Kanban board with drag-and-drop task management, Supabase persistence, and real-time sync.

## Features

- Three workflow columns: `To Do`, `In Progress`, `Done`
- Drag-and-drop task movement and reordering with `@dnd-kit`
- Create, edit, and delete tasks from the UI
- Team member visibility/edit model with predefined users
- Real-time updates through Supabase Realtime subscription
- Optimistic UI updates for task mutations
- Tailwind CSS v4 + shadcn/ui component system

## Tech Stack

- `Next.js` (App Router)
- `React` + `TypeScript`
- `Zustand` for client state
- `Supabase` (`@supabase/ssr`) for database + realtime
- `@dnd-kit` for drag-and-drop
- `Tailwind CSS v4` + shadcn/ui

## Project Structure

```txt
app/
  layout.tsx
  page.tsx
components/
  kanban/
    kanban-board.tsx
    kanban-column.tsx
    task-card.tsx
    task-modal.tsx
  ui/
hooks/
lib/
  supabase/
store/
  task-store.ts
types/
  index.ts
scripts/
  001_create_tasks_table.sql
  002_alter_tasks_table.sql
  003_simplify_tasks_table.sql
```

## Prerequisites

- Node.js 18+ (Node 20+ recommended)
- npm
- A Supabase project

## Environment Variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup (Supabase)

Run SQL scripts in order in the Supabase SQL editor:

1. `scripts/001_create_tasks_table.sql`
2. `scripts/002_alter_tasks_table.sql`
3. `scripts/003_simplify_tasks_table.sql`

These scripts create the `tasks` table, configure RLS policies, enable realtime, and align columns with the app model (`assigned_user`).

## Team Users (Can View & Edit)

Current default users configured in the app:

- `Mehedi Pathan`
- `Aisha Rahman`
- `Tanvir Ahmed`
- `Nusrat Jahan`
- `Fahim Hossain`
- `Sadia Karim`

How this currently works:

- All users can view and edit tasks (public board style access via RLS policy).
- Assignee selection in task form is limited to the predefined user list plus `Unassigned`.
- User list is managed from `lib/team-users.ts`.

## Getting Started

Install dependencies and run development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - start local dev server
- `npm run build` - create production build
- `npm run start` - start production server
- `npm run lint` - run lint checks

## Notes and Current Project Health

- `npm run build` succeeds.
- You may see a Next.js warning: middleware convention is deprecated; `middleware.ts` should be moved to proxy convention in a future update.
- `next.config.mjs` currently has `typescript.ignoreBuildErrors: true`, so type errors do not fail production builds.

## Known Issues

- Linting currently fails because `eslint` is not available as an installed dependency in this project.
  - Error seen: `sh: eslint: command not found`
  - Fix:
    ```bash
    npm install -D eslint eslint-config-next
    ```

## Security Notes

- `.env.local` should never be committed.
- If a real Supabase anon key was exposed publicly, rotate it from Supabase project settings.

## Deployment

Deploy as a standard Next.js app (for example on Vercel):

1. Set the same environment variables in your hosting platform.
2. Ensure Supabase table + policies are already created.
3. Build and deploy.

## Future Improvements

- Add server-side validation and stricter form schema validation
- Add loading/error UI around all async actions
- Add automated tests for drag-drop and store logic
- Add proper lint and typecheck CI pipeline

## Future Scalability Plan

To scale this project for larger teams and production use:

- Add real authentication with Supabase Auth (email/password, OAuth, SSO).
- Move from public RLS to role-based access control (admin/editor/viewer policies).
- Introduce workspaces/projects and board-level permissions.
- Replace static users with a `users` + `memberships` table managed from backend.
- Add API rate limiting, activity logs, and audit trails for compliance.
- Add cursor-based pagination and query optimization for high task volume.
- Introduce background jobs for notifications, reminders, and automation rules.
- Add caching and edge distribution strategy for global low-latency access.
