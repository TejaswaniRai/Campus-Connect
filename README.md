# Campus Connect

Campus Connect is a shared university operations workspace for students, faculty, and administrators. It connects classroom scheduling, announcements, study materials, faculty search, and lost-and-found reports in one Next.js application.

## Features

### Student portal

- Browse room availability by floor and inspect a room's full-day timetable.
- See current time, occupied, available, maintenance, and room-capacity details.
- Search faculty by name, email, and department.
- Read announcements and reply to posts.
- Browse study materials.
- Report lost or found items and submit ownership claims with proof.

### Admin portal

- View the same live schedule data used by the student portal.
- Book rooms for valid weekday time slots.
- Monitor free, occupied, and maintenance room counts.
- Manage announcements, faculty records, rooms, floors, subjects, and study materials.
- Review lost-and-found reports and submitted claim details.

### Faculty portal

- Use the shared schedule and lost-and-found workflows.
- Manage rooms, floors, subjects, teachers, announcements, and study materials.

## Architecture

- **Framework:** Next.js 15 App Router with React 19 and TypeScript.
- **UI:** Tailwind CSS, Radix UI primitives, Lucide icons, and React Query.
- **API:** Next.js route handlers under `src/app/api`.
- **Storage:** In-memory schedule data plus local JSON stores for announcements and lost-and-found.
- **Connection model:** All portals use relative `/api/...` requests, so student and admin views share the same server-side data paths without a separate frontend/backend origin.

## Local setup

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000/login` in a browser.

Useful checks:

```bash
npm run lint
npm run build
```

## Deployment

Campus Connect deploys as one Next.js service:

```bash
npm run build
npm start
```

No hardcoded localhost API URLs are used. The JSON data files are included in Next.js output tracing, and `LOCAL_DATA_DIR` can point to a writable mounted directory:

```env
LOCAL_DATA_DIR=/path/to/writable/data
```

The no-database setup is appropriate for local development, demos, and a single long-running Node process. In serverless or multi-instance hosting, local files may be ephemeral or isolated per instance. Use a hosted database before relying on permanent cross-instance writes.

## Project structure

```text
src/app/(dashboard)/       Student, faculty, and admin pages
src/app/api/               Shared server-side API routes
src/components/            Reusable UI and feature components
src/lib/                   Stores and scheduling utilities
src/types/                 Shared TypeScript types
data/                      Local JSON data files
```
