# TeamForge

A unified team productivity platform that replaces Slack, Linear, Notion, and ClickUp in a single application. Built for engineering teams who want project management, task tracking, bug reporting, real-time chat, collaborative docs, AI-powered code scanning, and a built-in AI assistant — all in one place.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Server Components) |
| UI | [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS 4](https://tailwindcss.com/) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL + RLS + Realtime) |
| Auth | Supabase Auth (Email, Magic Link, Google, GitHub OAuth) |
| AI | [Vercel AI SDK](https://sdk.vercel.ai/) with multi-provider support (OpenRouter, Claude, OpenAI, Gemini) |
| State | [TanStack React Query](https://tanstack.com/query) + [Zustand](https://zustand.docs.pmnd.rs/) |
| Rich Text | [BlockNote](https://www.blocknotejs.org/) (Notion-like editor) |
| Drag & Drop | [dnd-kit](https://dndkit.com/) |
| Charts | [Recharts](https://recharts.org/) |
| Email | [Resend](https://resend.com/) |
| Push | Web Push API |
| Hosting | [Vercel](https://vercel.com/) |

## Features

### Workspace & Team Management
- Multi-tenant workspaces with invite links
- Custom roles with 30+ granular permission flags
- 5 system roles: Owner, Admin, Manager, Member, Viewer
- Member management with role assignment and removal

### Project Management
- Projects with statuses, priorities, dates, and GitHub repo connections
- Customizable status workflows per project
- Project-level labels and settings
- Project lead assignment

### Task Management
- Full task lifecycle: epics, stories, tasks, subtasks
- Kanban board with drag-and-drop (dnd-kit)
- List view with sortable columns and bulk actions
- Calendar view (tasks by due date)
- Timeline/Gantt view
- Task detail pages with comments, activity log, and subtasks
- Filter bar with saved views
- CSV and PDF export
- Auto-generated identifiers (PROJ-1, PROJ-2, ...)

### Bug Tracking
- Dedicated bug tracker per project
- 5 severity levels (cosmetic to blocker) and 6 statuses
- Bug detail panel with inline editing
- AI-powered duplicate detection on bug creation
- Bug-to-task linking
- CSV and PDF export

### Real-Time Chat
- Public, private, DM, and project channels
- Threaded replies
- @mentions with autocomplete
- Emoji reactions (quick picker + inline)
- Emoji picker for message composition
- Typing indicators and online presence
- Unread message tracking with visual indicators
- Pinned messages
- Channel info sidebar (members, pins, files)

### Wiki / Docs (Notion-like)
- BlockNote block editor (headings, lists, code, tables, images, etc.)
- Nested page tree with unlimited depth
- Page templates
- Version history with restore
- Workspace-level and project-level wikis
- Full-text search across all pages
- Markdown and wiki export

### AI Assistant
- Built-in chat assistant accessible from every page
- Context-aware (knows current project/task/page)
- Multi-provider: OpenRouter (default), Claude, OpenAI, Gemini
- Tool calling: query projects, create tasks, search, get insights
- Streaming responses via Vercel AI SDK
- Workspace-level AI configuration

### Code Scanning & GitHub Integration
- Connect GitHub repos to projects
- Manual and webhook-triggered scans
- Scan dashboard: quality gauge, language breakdown, commit stats, issues table
- AI-powered code analysis
- Inbound GitHub webhooks (push, PR, review events)

### REST API & MCP Server
- Full CRUD REST API (`/api/v1/`) with API key authentication
- API key management (create, revoke, delete)
- MCP Server endpoint for Claude Code / Cursor integration
- Outbound webhook support (task, bug, scan, member events)

### Notifications
- In-app notifications with real-time delivery (Supabase Realtime)
- Email notifications (Resend)
- Push notifications (Web Push API)
- Per-type notification preferences (in-app, email, push toggles)
- Quiet hours configuration

### Analytics & Dashboard
- Personal dashboard: my tasks, overdue items, activity feed, unread messages
- Workspace analytics: tasks per member, activity heatmap, bug trends
- Project progress tracking with completion percentages

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com/) project
- (Optional) [Vercel](https://vercel.com/) account for deployment

### 1. Clone the repository

```bash
git clone https://github.com/Mahad-007/TeamForge.git
cd TeamForge
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI (default provider)
OPENROUTER_API_KEY=your-openrouter-key

# Cron jobs
CRON_SECRET=your-cron-secret

# Email (optional)
RESEND_API_KEY=your-resend-key

# Push notifications (optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# GitHub webhooks (optional)
GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

### 4. Set up the database

Apply the Supabase migrations:

```bash
npx supabase db push
```

Or run the SQL files in `supabase/migrations/` manually in the Supabase SQL editor.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, signup, etc.)
│   ├── (app)/                    # Authenticated app
│   │   └── [workspaceSlug]/      # Workspace-scoped routes
│   │       ├── dashboard/        # Personal dashboard
│   │       ├── projects/         # Project management
│   │       ├── chat/             # Real-time messaging
│   │       ├── wiki/             # Collaborative docs
│   │       ├── members/          # Team management
│   │       ├── roles/            # Role configuration
│   │       ├── analytics/        # Workspace analytics
│   │       └── settings/         # Workspace settings
│   └── api/                      # API routes
│       └── v1/                   # REST API endpoints
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── tasks/                    # Task management components
│   ├── bugs/                     # Bug tracking components
│   ├── chat/                     # Chat & messaging components
│   ├── wiki/                     # Wiki/docs components
│   ├── scans/                    # Code scan dashboard
│   ├── analytics/                # Analytics charts
│   ├── members/                  # Team management components
│   ├── settings/                 # Settings components
│   ├── ai/                       # AI assistant components
│   ├── dashboard/                # Dashboard widgets
│   ├── layout/                   # App shell (sidebar, header)
│   └── shared/                   # Shared components
├── hooks/                        # React Query hooks
├── lib/                          # Utilities and services
│   ├── supabase/                 # Supabase clients
│   ├── ai/                       # AI provider, tools, prompts
│   ├── api/                      # API auth and response helpers
│   └── export/                   # CSV and PDF export
├── stores/                       # Zustand stores
└── types/                        # TypeScript types and enums
```

## Database

The database consists of 26 tables with full Row-Level Security (RLS):

- **Core**: profiles, workspaces, workspace_members, workspace_invites, roles
- **Projects**: projects, project_members, labels
- **Tasks**: tasks, task_comments, task_activity_log
- **Bugs**: bugs
- **Chat**: channels, channel_members, messages
- **Wiki**: wiki_pages, wiki_page_versions
- **AI**: ai_conversations, ai_messages
- **Integration**: repository_scans, api_keys, webhooks, reminders
- **System**: notifications, notification_preferences, saved_views

All tables have RLS policies enforcing multi-tenant isolation at the database level.

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

Set the environment variables in the Vercel dashboard, then deploy.

### Cron Jobs

Configure in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "* * * * *" },
    { "path": "/api/cron/due-dates", "schedule": "0 9 * * *" }
  ]
}
```

## API Reference

Base URL: `/api/v1/`  
Auth: `Authorization: Bearer tf_live_xxxxx`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List projects |
| POST | `/projects` | Create project |
| GET | `/projects/:id` | Get project |
| GET | `/projects/:id/tasks` | List tasks |
| POST | `/projects/:id/tasks` | Create task |
| GET | `/tasks/:identifier` | Get task by ID (e.g., PROJ-42) |
| PATCH | `/tasks/:identifier` | Update task |
| GET | `/projects/:id/bugs` | List bugs |
| POST | `/projects/:id/bugs` | Create bug |
| GET | `/members` | List members |
| GET | `/search?q=...` | Universal search |
| POST | `/v1/mcp` | MCP Server endpoint |

## License

MIT
