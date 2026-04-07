# How Do You Feel Today? — Implementation Guide

This is the scaffolded Next.js 14 application for the "How Do You Feel Today?" project.

## Project Structure

```
app/
  ├── layout.tsx           # Root layout with metadata
  ├── page.tsx             # Main page (renders VoteScreen or ResultsScreen)
  ├── globals.css          # Global Tailwind styles
  └── api/
      ├── vote/
      │   └── route.ts     # POST /api/vote
      └── stats/
          └── route.ts     # GET /api/stats

components/
  ├── VoteScreen.tsx       # Mood picker + note form
  ├── ResultsScreen.tsx    # Gauge + stats + notes feed
  ├── Gauge.tsx            # SVG mood gauge
  ├── MoodBar.tsx          # Percentage bar chart
  └── NoteCard.tsx         # Individual note display

lib/
  ├── constants.ts         # Mood definitions, thresholds
  ├── supabase.ts          # Server-side Supabase client
  └── supabase-browser.ts  # Browser-side Supabase client

hooks/
  └── useVoteState.ts      # localStorage vote state hook
```

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the schema SQL from `CONTEXT.md`'s **Supabase Schema** section:
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

3. Enable Row Level Security (RLS) on the `votes` table:
   - **INSERT**: Allow all (anonymous)
   - **SELECT**: Allow all (anonymous)
   - **UPDATE / DELETE**: Deny all

### 3. Configure Environment Variables

1. Copy `.env.local` and fill in your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
   ```

   You'll find these in your Supabase project settings → API.

### 4. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

## Component Features

### VoteScreen
- Shows 5 mood buttons (Awful → Great)
- Color-coded based on mood constant definitions
- Optional note textarea (max 280 chars)
- Submits via `POST /api/vote`
- Detects user's country via ipapi.co (optional, non-blocking)
- Stores vote in localStorage to prevent duplicate votes same day

### ResultsScreen
- Displays SVG gauge showing today's world average mood
- Shows 3 stat cards: total voices, world average, your mood
- Mood breakdown bars (with %)
- Notes feed (most recent first, max 20)
- Cold-start threshold: hides vote count if < 50 votes
- Auto-refreshes stats every 30 seconds

### API Routes

#### `POST /api/vote`
```json
{
  "mood": 4,
  "note": "Feeling good",
  "country": "US"
}
```

#### `GET /api/stats`
```json
{
  "total": 847,
  "avg": 3.4,
  "counts": [89, 142, 267, 218, 131],
  "notes": [...],
  "history": [...]
}
```

## TODO Items

Look for `TODO` comments in the codebase for:
- **Environment variables**: `.env.local` setup
- **Rate limiting**: Implement 1 vote per IP per day in `app/api/vote/route.ts`
- **Caching headers**: Already set in `app/api/stats/route.ts`
- **OG image**: Add screenshot to `public/og-image.png`

## Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git add .
git commit -m "Initial scaffold"
git push origin main

# In Vercel dashboard:
# 1. Import your GitHub repo
# 2. Add env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
# 3. Deploy
```

### Vercel Config

`vercel.json` is already configured with the `iad1` region for optimal latency.

## Key Libraries

- **Next.js 14**: React framework with App Router
- **Tailwind CSS**: Utility-first CSS
- **Supabase**: PostgreSQL + real-time APIs
- **@supabase/supabase-js**: Supabase JS client

## Development Notes

- Mobile-first design (tested at 375px width)
- No authentication — all data is public
- localStorage key format: `hdf_voted_YYYY-MM-DD` (one per day)
- SVG gauge dynamically calculates needle angle from average
- Notes are 280 characters max (Twitter-like limit)
- Mood detection returns ISO 3166-1 alpha-2 country codes

## Next Steps (v1 Feature Complete)

Once this scaffold is working:
1. Deploy to Vercel
2. Buy a domain and wire it up
3. Test with 50+ votes to see cold-start threshold kick in
4. Monitor Vercel Analytics

## Planned v2 Features

- Personal mood history streak
- Daily archive (see past day's moods)
- Country filter on stats
- Word cloud from notes
- Shareable mood card
- Weekly email digest

---

**Built with ♥️ for seeing how the world really feels.**
