# FlowScope (Web)

A browser-based Next.js recreation of the FlowScope Electron desktop UI — a
session/command recording and documentation tool that lets you browse
recorded terminal sessions and inspect their transcripts, generated guides,
commands, session JSON, and blocks JSON.

This project reproduces the retro pastel-pink FlowScope look and its
three-panel layout (filters sidebar, session list, session detail) as a
normal web app, with **no Electron dependency** — it runs entirely in the
browser.

It currently ships with local mock data so the whole UI — search, sort,
time filters, tags, favorites, notes, tabs — works end to end without a
backend. See [Connecting a real backend](#connecting-a-real-backend) below.

## Requirements

- Node.js 18.18 or newer (Node 20 LTS recommended)
- npm 9+ (installed with Node)
- A modern browser (Chrome, Firefox, Safari, Edge)

No other services, databases, or accounts are required to run the project
— it's a static/client-rendered frontend with mock data baked in.

## Installation

```bash
npm install
```

## Running the app

Start the development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Create a production build:

```bash
npm run build
```

Then run the production build locally:

```bash
npm run start
```

> **Sandbox note:** this project was authored in a sandboxed environment
> without network access, so `npm install` / `npm run build` could not be
> executed there. Every `.ts`/`.tsx` file was checked with the TypeScript
> parser for syntax errors, and every CSS Module class reference was
> cross-checked against its stylesheet, but please run a real
> `npm install && npm run build` locally as a final check before deploying.

## Project structure

```
app/
  layout.tsx          Root layout, loads global styles
  page.tsx             Entry point — renders <AppShell> with mock data
  globals.css          FlowScope color palette (CSS variables) + shared utility classes
components/
  AppShell.tsx          Owns top-level state (sessions, filters, selection) and layout
  TopBar.tsx             Branding, folder selector, search, sort dropdown
  Sidebar.tsx             Library counts, time filters, tags, favorites-only toggle
  SessionList.tsx         Filtered/sorted list of session cards
  SessionCard.tsx          A single session summary card
  SessionDetails.tsx      Header + tabs + active tab content for the selected session
  SessionTabs.tsx          Overview / Transcript / Guide / Session JSON / Blocks JSON tab strip
  OverviewTab.tsx          Stat cards, notes editor, session actions
  TranscriptTab.tsx        Terminal-style transcript rendering
  GuideTab.tsx              Generated guide display / empty state
  JsonViewer.tsx            Syntax-highlighted JSON viewer (used by both JSON tabs)
  NotesEditor.tsx           Session notes textarea
  StatsCard.tsx              Small stat display used in the Overview tab
  TagButton.tsx              Removable tag chip + "add tag" control
  EmptyState.tsx             Shared empty-state message
  *.module.css               One CSS Module per component, all built on the
                              shared --fs-* variables defined in globals.css
data/
  mockSessions.ts       Mock Session[] covering favorites, tags, guides, transcripts, JSON
types/
  session.ts             Session / Guide / TranscriptLine / filter & sort types
```

## Components

- **AppShell** — the top-level client component. Holds all application
  state (the session list, the current selection, the active tab, search
  text, time filter, sort order, favorites-only toggle) and lays out the
  three columns. All state-mutating handlers (select session, toggle
  favorite, add/remove tag, edit notes, delete session, choose folder,
  refresh) live here and are passed down as props.
- **TopBar** — the FlowScope logo, the current folder path, "Choose
  Folder...", refresh, the search box, and the sort dropdown.
- **Sidebar** — the "Library" counts (sessions / guides / commands), the
  "When" time-range filter buttons, the "Tags" list, and the
  "Favorites only" toggle.
- **SessionList** / **SessionCard** — renders the filtered, sorted list of
  sessions in the middle column; each card shows the title, a guide-status
  badge, command count, duration, tags, and highlights when selected.
- **SessionDetails** — the right-hand panel for the selected session: title,
  favorite heart button, command count, tag chips + add-tag control, and
  the tab strip with its active tab's content.
- **SessionTabs** — the Overview / Transcript / Guide / Session JSON /
  Blocks JSON tab buttons.
- **OverviewTab** — stat cards (commands, duration, guide status), the
  "no blocks.json" empty-state message when relevant, the notes editor, and
  the Open PDF / Reveal in Folder / Delete Session actions.
- **TranscriptTab** — renders the recorded transcript in a terminal-style
  block, distinguishing typed input lines from output lines.
- **GuideTab** — renders the generated guide's summary and numbered steps,
  or an empty state if no guide has been generated yet.
- **JsonViewer** — a shared, syntax-highlighted JSON pretty-printer used by
  both the Session JSON and Blocks JSON tabs.
- **NotesEditor** — the editable notes textarea for a session.
- **StatsCard** — a single labeled stat, used in the Overview tab.
- **TagButton** — exports a removable `TagChip` and the `AddTagButton`
  inline add-tag control used in the SessionDetails header.
- **EmptyState** — a shared, reusable "nothing here" message used across
  the session list, transcript, guide, and JSON views.

## Data model

```ts
interface Session {
  id: string;
  title: string;
  createdAt: string; // ISO date
  duration: number;  // seconds
  favorite: boolean;
  tags: string[];
  commands: string[];
  transcript: TranscriptLine[];
  guide: Guide | null;
  sessionJson: Record<string, unknown>;
  blocksJson: Record<string, unknown> | null;
  notes: string;
}
```

## Connecting a real backend

**The data currently shown is mock data.** `data/mockSessions.ts` exports a
hard-coded `Session[]` array that `app/page.tsx` passes into `<AppShell>`
as `initialSessions`. It exists purely so the interface is fully
demonstrable — searching, sorting, filtering, favorites, tags, notes, and
all five tabs — without any backend running.

This is intentionally the *only* place mock data is defined; every other
component treats whatever `Session[]` it's given as the source of truth.
To connect the real FlowScope Python backend later:

1. Replace the contents of `data/mockSessions.ts` (or add a new data
   source) with a fetch against your backend's API — e.g. a server
   component data fetch, a Next.js API route/proxy, or a client-side
   effect inside `AppShell` — returning data shaped like `Session[]`.
2. Wire the mutating handlers in `AppShell.tsx` (`handleToggleFavorite`,
   `handleAddTag`, `handleRemoveTag`, `handleNotesChange`,
   `handleDeleteSession`, `handleChooseFolder`, `handleRefresh`) to call
   the backend instead of only updating local React state.
3. `OverviewTab`'s "Open PDF" and "Reveal in Folder" buttons currently show
   placeholder status messages — point them at real backend
   endpoints/file-system calls once available.

No component below `AppShell` needs to change to support this — they're
all driven by props.

## Responsive behavior

- **Desktop (>1180px):** full three-column layout (sidebar, session list,
  details).
- **Tablet (900–1180px):** sidebar and session list narrow.
- **Mobile (<900px):** the three columns stack vertically, with the
  sidebar and session list capped to a scrollable height above the details
  panel.
