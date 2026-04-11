# How Do You Feel Today?

A minimalist social experiment. One question per day. One global answer.

**[howdoyoufeeltoday.today](https://howdoyoufeeltoday.today)** · **[@hdyfeeltoday](https://x.com/hdyfeeltoday)**

---

## What is it?

Anyone in the world picks a mood (Awful → Great), optionally leaves a note, and sees a live gauge showing how the world feels right now. No login, no account, no tracking. Just an anonymous daily snapshot of human emotion.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |
| Rate limiting | Upstash Redis |
| Push notifications | Web Push API (VAPID) |
| Twitter bot | twitter-api-v2 |

---

## Features

- **Daily vote** — one mood per day, localStorage dedup
- **Live gauge** — animated SVG needle, ambient background by mood
- **Resonance line** — qualitative: "Many people felt Good — just like you"
- **Streak strip** — shown before voting so you have something to lose
- **4-week heatmap** — personal mood history, opens in modal
- **Word cloud** — from today's notes (shown when ≥10 notes)
- **Share card** — PNG image of your mood + world average
- **Dark / light / system theme**
- **PWA** — installable on mobile homescreen
- **Web push** — daily reminder at 18:00 UTC, Sunday weekly summary
- **Twitter bot** — @hdyfeeltoday posts a daily summary at 23:58 UTC
- **Daily archive** — `/archive/YYYY-MM-DD` read-only view of any past day
- **Rate limiting** — 3 votes per IP per 24h (Upstash Redis)

---

## Local Setup

### 1. Install

```bash
npm install
```

### 2. Environment variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...

# Push notifications (generate with: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=you@email.com

# Cron auth (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
CRON_SECRET=...

# Rate limiting (upstash.com — free tier)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Twitter bot (developer.twitter.com — free tier, Read+Write)
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_TOKEN_SECRET=...

# Site URL
NEXT_PUBLIC_SITE_URL=https://howdoyoufeeltoday.today
```

### 3. Supabase setup

Run in the Supabase SQL editor:

```sql
-- Main votes table
create table votes (
  id          uuid primary key default gen_random_uuid(),
  mood        smallint not null check (mood between 1 and 5),
  note        text check (char_length(note) <= 280),
  country     char(2),
  vote_date   date not null default current_date,
  created_at  timestamptz not null default now()
);
create index votes_date_idx on votes (vote_date);

-- Push subscriptions
create table push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
alter table push_subscriptions enable row level security;
create policy "anon insert" on push_subscriptions for insert to anon with check (true);
create policy "anon delete" on push_subscriptions for delete to anon using (true);
```

Then run the `get_stats` RPC from `CLAUDE.md`. Enable RLS on `votes` (INSERT + SELECT for anon).

### 4. Run

```bash
npm run dev
```

---

## Cron jobs (Vercel)

| Route | Schedule | What it does |
|---|---|---|
| `/api/push/send` | 18:00 UTC daily | Daily push reminder. Sundays: weekly summary |
| `/api/tweet/send` | 23:58 UTC daily | Posts mood summary to @hdyfeeltoday |

Both are protected by `CRON_SECRET`.

---

## Key rules

- **Day boundary**: UTC midnight. All dates use UTC.
- **Cold start**: total vote count hidden until ≥50 votes. Shows `•••` below threshold.
- **Heatmap**: only renders after 7 days of personal data.
- **Notes feed**: top 20 reverse-chronological. No pagination.
- **No PII**: no IPs stored, no fingerprinting, no cookies.

---

## Planned v3

- World mood map (choropleth by country)
- Mood by hour of day (global heatmap)
- Country filter on gauge + feed
