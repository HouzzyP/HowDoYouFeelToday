# CLAUDE.md — howdoyoufeeltoday

## What is this project?

A minimalist social experiment web app. One question per day: **"How do you feel today?"**
Users pick a mood (1–5), optionally leave a short note, and see a live global mood gauge.
No login, no account, no email. Frictionless by design.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |
| Geolocation | ipapi.co (free tier, no key needed) |
| Analytics | Vercel Analytics |

---

## Project Structure

```
app/
  layout.tsx                    # Root layout, fonts, metadata, OG tags
  page.tsx                      # Renders VoteScreen or ResultsScreen based on localStorage
  globals.css
  api/
    vote/route.ts               # POST /api/vote — validates + inserts a vote
    stats/route.ts              # GET /api/stats?date=YYYY-MM-DD — single RPC call
  archive/
    [date]/page.tsx             # /archive/YYYY-MM-DD — read-only past day view
components/
  VoteScreen.tsx                # Mood picker + note textarea + submit
  ResultsScreen.tsx             # Gauge + stat cards + mood bars + streak + notes feed
  Gauge.tsx                     # SVG speedometer (hero element)
  MoodBar.tsx                   # Single percentage bar per mood level
  NoteCard.tsx                  # One entry in the notes feed
  StreakBar.tsx                 # 7-day personal mood strip (links to archive)
lib/
  supabase.ts                   # Supabase client (server + browser — single instance)
  supabase-browser.ts           # Re-exports from supabase.ts (kept for compatibility)
  constants.ts                  # MOODS array, thresholds, limits
hooks/
  useVoteState.ts               # Reads/writes localStorage vote state
  useStreak.ts                  # Reads last 7 days of moods from localStorage
```

---

## Database

### Table: `votes`

```sql
create table votes (
  id          uuid primary key default gen_random_uuid(),
  mood        smallint not null check (mood between 1 and 5),
  note        text check (char_length(note) <= 280),
  country     char(2),
  vote_date   date not null default current_date,
  created_at  timestamptz not null default now()
);

create index votes_date_idx on votes (vote_date);
```

**No user IDs, no IPs stored, no fingerprinting.**

### Required SQL RPC — run this in Supabase SQL editor

The `GET /api/stats` route delegates all aggregation to this Postgres function.
**Must be created before the app works.**

```sql
create or replace function get_stats(p_date date)
returns json
language sql
stable
security definer
as $$
  with
  day_stats as (
    select
      count(*)                                        as total,
      coalesce(round(avg(mood)::numeric, 2), 0)       as avg_mood,
      count(*) filter (where mood = 1)                as c1,
      count(*) filter (where mood = 2)                as c2,
      count(*) filter (where mood = 3)                as c3,
      count(*) filter (where mood = 4)                as c4,
      count(*) filter (where mood = 5)                as c5
    from votes
    where vote_date = p_date
  ),
  notes_feed as (
    select json_agg(
      json_build_object(
        'mood',       mood,
        'note',       note,
        'country',    country,
        'created_at', created_at
      ) order by created_at desc
    ) as notes
    from (
      select mood, note, country, created_at
      from votes
      where vote_date = p_date
        and note is not null
        and note <> ''
      order by created_at desc
      limit 20
    ) n
  ),
  history_agg as (
    select json_agg(
      json_build_object(
        'date',  vote_date,
        'avg',   round(avg(mood)::numeric, 2),
        'total', count(*)
      ) order by vote_date desc
    ) as hist
    from (
      select vote_date, mood
      from votes
      where vote_date >= p_date - 29
        and vote_date <= p_date
    ) sub
    group by vote_date
  )
  select json_build_object(
    'total',   d.total,
    'avg',     d.avg_mood,
    'counts',  json_build_array(d.c1, d.c2, d.c3, d.c4, d.c5),
    'notes',   coalesce(n.notes,  '[]'::json),
    'history', coalesce(h.hist,   '[]'::json)
  )
  from day_stats d, notes_feed n, history_agg h
$$;
```

### RLS Policies (required — never skip)

- **INSERT**: allowed for anon
- **SELECT**: allowed for anon
- **UPDATE / DELETE**: disabled

> The anon key is public by design, but it is only safe if RLS is active. Always verify RLS is enabled before deploying.

---

## API Routes

### `POST /api/vote`

Always validate server-side (not just client-side):
- `mood`: integer between 1 and 5 (required)
- `note`: string, max 280 chars (optional)
- `country`: 2-char ISO string or null (optional)

Never trust the client. Reject malformed requests with 400.

Add rate limiting per IP (Edge Middleware or `@upstash/ratelimit`) as a backend guard — localStorage dedup is client-only and trivially bypassed.

### `GET /api/stats`

Accepts optional `?date=YYYY-MM-DD` query param (used by archive pages).
Defaults to today. Rejects future dates and malformed strings.

Delegates everything to the `get_stats(p_date)` SQL RPC — **zero JS aggregation**.

Cache headers:
- Today → `Cache-Control: public, max-age=60`
- Past dates → `Cache-Control: public, max-age=3600`

---

## Key Logic Rules

- **Deduplication** is localStorage-based: key `hdf_voted_YYYY-MM-DD`. If it exists, skip VoteScreen and show ResultsScreen directly.
- **Cold start rule**: hide the total vote count until `total_votes >= 50`. Below that threshold, show only percentages. This prevents the site from looking dead.
- **Notes feed**: top 20, reverse-chronological. No pagination in v1.
- **Gauge needle angle**: `((avg - 1) / 4) * 180 - 90`
- **Streak bar**: shown only on today's ResultsScreen, hidden on archive pages. Only renders if the user has voted at least one day this week.
- **Archive pages**: `/archive/YYYY-MM-DD` — read-only, no voting, no streak bar. Future dates and invalid formats show an error state.

---

## Constants (`lib/constants.ts`)

```ts
export const MOODS = [
  { label: 'Awful', color: '#E24B4A', bg: '#FCEBEB', dark: '#A32D2D' },
  { label: 'Bad',   color: '#D85A30', bg: '#FAECE7', dark: '#712B13' },
  { label: 'Okay',  color: '#EF9F27', bg: '#FAEEDA', dark: '#633806' },
  { label: 'Good',  color: '#1D9E75', bg: '#E1F5EE', dark: '#085041' },
  { label: 'Great', color: '#0F6E56', bg: '#E1F5EE', dark: '#04342C' },
] as const;

export const COLD_START_THRESHOLD = 50;
export const NOTE_MAX_CHARS = 280;
export const NOTES_FEED_LIMIT = 20;
```

---

## Design & UX Rules

- **Mobile-first**: entire UI must work at 375px width
- **The Gauge SVG is the hero element** — keep it crisp and centered on mobile
- Fade in ResultsScreen after voting: 150ms opacity transition (implemented via inline style + `requestAnimationFrame`)
- No auth, no cookies (localStorage only for dedup)
- Color ramp: red → orange → amber → teal → green (Awful → Great)

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
```

- Never commit `.env.local`
- Set these in the Vercel dashboard for production

---

## What NOT to do

- Do not add authentication or user accounts (v1 is intentionally anonymous)
- Do not store IPs or any PII in the database
- Do not paginate the notes feed in v1 — just top 20
- Do not process aggregations in JavaScript — do it in SQL via the `get_stats` RPC
- Do not add cookies (beyond what Next.js/Vercel requires internally)
- Do not add features outside the current scope without explicit instruction

---

## Deployment Checklist

- [ ] Create Supabase project → run schema SQL → run `get_stats` RPC SQL → enable RLS policies
- [ ] Set env vars in Vercel dashboard
- [ ] Configure CORS in Supabase to allow the production domain
- [ ] Add `vercel.json` with `{ "regions": ["iad1"] }` (already present)
- [ ] Enable Vercel Analytics (one line in layout)
- [ ] Buy domain → connect to Vercel
- [ ] Test cold start threshold (< 50 votes → count hidden, percentages visible)
- [ ] Test archive page: `/archive/YYYY-MM-DD` with a valid past date
- [ ] Set up Supabase manual snapshot (free tier backup)
- [ ] Add server-side rate limiting to `/api/vote` (currently TODO in route)

---

## Implemented v2 Features

- [x] **Personal streak bar**: 7-day mood strip shown in ResultsScreen, each dot links to that day's archive
- [x] **Daily archive**: `/archive/YYYY-MM-DD` — read-only past day view using the same RPC

## Planned v2 Features (do not implement unless asked)

- Country filter on gauge + feed
- Word cloud from today's notes
- Shareable mood card (PNG generation)
