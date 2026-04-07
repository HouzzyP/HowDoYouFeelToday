# howdoyoufeeltoday — Project Context for Copilot

## What is this?

A minimalist social experiment web app where anyone in the world can answer one question per day: **"How do you feel today?"**. Users pick a mood level (1–5), optionally leave a short note, and then see a live "world mood gauge" showing the global average — plus a feed of anonymous notes from other users.

The concept is intentionally frictionless: no login, no account, no email. Just a single tap and you're part of a global snapshot.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | Easy Vercel deploy, RSC + API routes |
| Styling | **Tailwind CSS** | Fast iteration |
| Database | **Supabase** (PostgreSQL) | Free tier handles early traffic, real-time subscriptions available |
| Deployment | **Vercel** | Zero-config for Next.js |
| Geolocation | **ipapi.co** (free tier) | IP → country code, no key needed for low volume |
| Analytics | **Vercel Analytics** (free) | Page views without cookies |

---

## Supabase Schema

### Table: `votes`

```sql
create table votes (
  id          uuid primary key default gen_random_uuid(),
  mood        smallint not null check (mood between 1 and 5),
  note        text check (char_length(note) <= 280),
  country     char(2),           -- ISO 3166-1 alpha-2 (e.g. 'US', 'AR')
  vote_date   date not null default current_date,
  created_at  timestamptz not null default now()
);

-- Index for fast daily aggregations
create index votes_date_idx on votes (vote_date);
```

> **No user IDs, no fingerprinting.** Deduplication is handled client-side with a localStorage key: `hdf_voted_<YYYY-MM-DD>`. If the key exists, the vote screen is skipped and the user lands directly on the results screen.

### Useful queries

```sql
-- Global stats for today
select
  count(*)                                        as total_votes,
  round(avg(mood)::numeric, 2)                    as avg_mood,
  count(*) filter (where mood = 1)                as awful,
  count(*) filter (where mood = 2)                as bad,
  count(*) filter (where mood = 3)                as okay,
  count(*) filter (where mood = 4)                as good,
  count(*) filter (where mood = 5)                as great
from votes
where vote_date = current_date;

-- Stats by country for today
select country, count(*) as votes, round(avg(mood)::numeric, 2) as avg_mood
from votes
where vote_date = current_date and country is not null
group by country
order by votes desc;

-- Historical daily averages (for trend chart)
select vote_date, round(avg(mood)::numeric, 2) as avg_mood, count(*) as total
from votes
group by vote_date
order by vote_date desc
limit 30;

-- Recent notes feed
select mood, note, country, created_at
from votes
where vote_date = current_date and note is not null and note != ''
order by created_at desc
limit 20;
```

---

## Project File Structure

```
howdoyoufeeltoday/
├── app/
│   ├── layout.tsx            # Root layout, fonts, metadata
│   ├── page.tsx              # Main page — renders VoteScreen or ResultsScreen
│   ├── globals.css
│   └── api/
│       ├── vote/
│       │   └── route.ts      # POST /api/vote — inserts a vote
│       └── stats/
│           └── route.ts      # GET /api/stats — returns today's aggregated stats + recent notes
├── components/
│   ├── VoteScreen.tsx        # Mood picker + note textarea + submit button
│   ├── ResultsScreen.tsx     # Gauge + breakdown + notes feed
│   ├── Gauge.tsx             # SVG speedometer component
│   ├── MoodBar.tsx           # Single row of the percentage breakdown
│   └── NoteCard.tsx          # Individual comment in the feed
├── lib/
│   ├── supabase.ts           # Supabase client (server-side)
│   ├── supabase-browser.ts   # Supabase client (browser-side, if needed)
│   └── constants.ts          # Mood labels, colors, etc.
├── hooks/
│   └── useVoteState.ts       # Reads/writes localStorage vote state
├── public/
│   └── og-image.png          # Open Graph image (the gauge screenshot)
├── .env.local                # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
└── CONTEXT.md                # This file
```

---

## Key Components — Behavior & Logic

### `VoteScreen`
- Shows 5 mood buttons: **Awful / Bad / Okay / Good / Great**
- Color ramp from red → orange → amber → teal → green
- Optional textarea (max 280 chars)
- Submit button disabled until a mood is selected
- On submit: calls `POST /api/vote`, then saves `hdf_voted_<date>` and `hdf_mood_<date>` to localStorage, then transitions to ResultsScreen

### `ResultsScreen`
- Reads stats from `GET /api/stats`
- Shows:
  1. **SVG Gauge** (speedometer from 1–5, needle points to today's average)
  2. **3 stat cards**: total voices today · world average · your mood
  3. **Mood breakdown bars** (% per level)
  4. **Notes feed** (anonymous, most recent first, flag + country if available)
- ⚠️ **Cold start rule**: hide the "X voices today" count until `total_votes >= 50`. Before that threshold, show only percentages. This avoids users feeling they're on a dead site.

### `Gauge` (SVG)
- 5 arc segments, colored Awful→Great
- Needle calculated from average score: angle = `((avg - 1) / 4) * 180 - 90`
- Shows score number and label in center
- Labels "Awful" and "Great" at arc ends

### `useVoteState` hook
```ts
// Returns:
{
  hasVoted: boolean,        // true if localStorage has today's key
  myMood: number | null,    // 1–5, stored after voting
  markVoted: (mood: number) => void
}
// Key format: hdf_voted_2025-03-26  (one per calendar day)
```

---

## API Routes

### `POST /api/vote`

**Request body:**
```json
{
  "mood": 4,
  "note": "Feeling productive today",
  "country": "AR"
}
```

**Logic:**
1. Validate mood (1–5), note (max 280 chars), country (optional, 2-char ISO)
2. Insert into `votes` table
3. Return `{ success: true }`

**Rate limiting:** Add a simple in-memory check or use Vercel's edge middleware to limit to 1 vote per IP per day as a backup to the localStorage check.

### `GET /api/stats`

**Response:**
```json
{
  "total": 847,
  "avg": 3.4,
  "counts": [89, 142, 267, 218, 131],
  "notes": [
    {
      "mood": 4,
      "note": "Finally finished a big project",
      "country": "US",
      "created_at": "2025-03-26T14:23:00Z"
    }
  ],
  "history": [
    { "date": "2025-03-25", "avg": 3.2, "total": 1203 },
    { "date": "2025-03-24", "avg": 3.5, "total": 988 }
  ]
}
```

**Caching:** Add `Cache-Control: public, max-age=60` — stats refresh every 60s, no need for real-time on early traffic.

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

export const COLD_START_THRESHOLD = 50; // hide vote count below this
export const NOTE_MAX_CHARS = 280;
export const NOTES_FEED_LIMIT = 20;
```

---

## Country / Flag Detection

```ts
// In VoteScreen.tsx — runs on mount, non-blocking
async function detectCountry(): Promise<string | null> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return data.country_code ?? null; // 'AR', 'US', etc.
  } catch {
    return null;
  }
}

// Convert country code to flag emoji
function countryFlag(code: string): string {
  return code.toUpperCase().split('').map(
    c => String.fromCodePoint(127397 + c.charCodeAt(0))
  ).join('');
}
```

---

## Environment Variables (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
```

Supabase anon key is safe to expose client-side — Row Level Security (RLS) on the `votes` table should be:
- **INSERT**: allowed for all (anon)
- **SELECT**: allowed for all (anon) — data is public
- **UPDATE / DELETE**: disabled

---

## SEO & Sharing

### `app/layout.tsx` metadata
```ts
export const metadata = {
  title: 'How Do You Feel Today?',
  description: 'A daily global mood check. One tap. See how the world feels right now.',
  openGraph: {
    title: 'How Do You Feel Today?',
    description: 'Join thousands sharing how they feel. See the world mood in real time.',
    images: ['/og-image.png'],
  },
  twitter: { card: 'summary_large_image' },
};
```

The OG image should be a static screenshot of the gauge at a "Good" reading — visually intriguing enough to make someone click from a tweet.

---

## Planned Features (v2+)

- **Personal history**: localStorage streak tracker — how have YOU felt this week?
- **Daily archive**: `/archive/2025-03-25` — see how the world felt on any past day
- **Country filter**: button group to filter the gauge + feed by country
- **Word cloud**: most common words in today's notes
- **Shareable card**: generate a PNG of your mood + the world gauge to share on social
- **Weekly email** (optional, no signup — just a public URL): `howdoyoufeeltoday.co/weekly`

---

## Deployment Checklist

- [ ] Create Supabase project → run schema SQL → enable RLS policies
- [ ] Set env vars in Vercel dashboard
- [ ] Add `vercel.json` with `{ "regions": ["iad1"] }` for low latency
- [ ] Set up Vercel Analytics (one line in layout)
- [ ] Buy domain → add to Vercel → Supabase allows the origin in CORS
- [ ] Test cold start threshold (submit <50 votes → count should be hidden)
- [ ] Set up Supabase daily backup (free tier: manual snapshots)

---

## Notes for Copilot

- The gauge SVG is the hero element — keep it crisp and centered on mobile
- Animations: fade in the results screen after voting (150ms opacity transition is enough)
- Mobile-first: the entire UI should work perfectly at 375px width
- No auth, no cookies (except the localStorage dedup key)
- Keep API responses fast — aggregate in SQL, don't process in JS
- The feed should show notes in reverse-chronological order, never paginated on v1 (just top 20)