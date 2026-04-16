import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(request: NextRequest): boolean {
    const auth = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    return auth === `Bearer ${secret}`;
}

// ─── Data pools ───────────────────────────────────────────────────────────────

// Mood distribution: Awful 8%, Bad 15%, Okay 30%, Good 32%, Great 15%
const MOOD_WEIGHTS = [8, 15, 30, 32, 15]; // index 0 = mood 1 (Awful)

// ~35% of votes include a note
const NOTE_RATE = 0.35;

// Weighted country pool — heavier weight = appears more often
const COUNTRY_POOL: [string, number][] = [
    ['US', 20], ['BR', 12], ['IN', 10], ['DE', 8],
    ['GB', 7],  ['FR', 6],  ['MX', 5],  ['CA', 5],
    ['AU', 4],  ['AR', 4],  ['ES', 3],  ['PL', 3],
    ['IT', 3],  ['NL', 3],  ['TR', 3],  ['ID', 3],
    ['NG', 2],  ['ZA', 2],  ['PH', 2],  ['SE', 2],
    ['CO', 2],  ['CL', 2],  ['RO', 2],  ['PT', 2],
    ['JP', 1],  ['KR', 1],  ['EG', 1],  ['PK', 1],
    ['UA', 1],  ['HU', 1],
];

const NOTES: Record<number, string[]> = {
    1: [
        "Really struggling today.",
        "Everything feels heavy.",
        "Can't shake this feeling.",
        "Just want the day to be over.",
        "Rough morning, rough afternoon.",
        "Feeling completely drained.",
        "Nothing is going right.",
        "Wish I could skip today.",
        "Low energy, low mood.",
        "Hard to stay positive right now.",
        "Didn't sleep well. Paying for it now.",
        "One of those days where everything stacks up.",
        "Feeling disconnected from everything.",
        "Anxious and tired at the same time.",
        "The world feels a bit too loud today.",
    ],
    2: [
        "Not my best day.",
        "Feeling a bit off.",
        "Could be worse, could be better.",
        "Tired and unmotivated.",
        "Headache that won't go away.",
        "Missing some people today.",
        "Work is stressing me out.",
        "Felt anxious most of the morning.",
        "Just going through the motions.",
        "Hard to focus on anything.",
        "Woke up on the wrong side.",
        "Overthinking everything today.",
        "Feels like I'm running on empty.",
        "Social battery is at zero.",
        "A bit sad, no particular reason.",
        "Things feel uncertain right now.",
        "Dragging myself through the day.",
    ],
    3: [
        "Normal day, nothing special.",
        "Getting through it.",
        "Neutral. Could go either way.",
        "Just another Tuesday.",
        "Fine, I guess.",
        "Busy but managing.",
        "Not bad, not great.",
        "Feeling pretty average.",
        "Took it one step at a time.",
        "Quiet day, which is okay.",
        "Nothing exciting, but stable.",
        "Kept my head above water.",
        "Low-key day. That's fine.",
        "Productive but a bit flat.",
        "Didn't love it, didn't hate it.",
        "Somewhere in the middle.",
        "Functional. That counts.",
    ],
    4: [
        "Had a nice moment this morning.",
        "Good energy today.",
        "Things are moving in the right direction.",
        "Grateful for small things.",
        "Coffee was perfect. Good start.",
        "Felt connected to people today.",
        "Checked off a lot of tasks.",
        "Laughed a lot today.",
        "Feeling more like myself.",
        "Good conversation with a friend.",
        "The weather helped my mood.",
        "Accomplished something I'd been putting off.",
        "Feeling settled and calm.",
        "Nice day overall.",
        "Woke up before my alarm and felt ready.",
        "Slow but steady progress.",
        "Found some peace in the chaos.",
    ],
    5: [
        "Genuinely happy today.",
        "Best day in a while.",
        "Everything clicked.",
        "Feeling alive.",
        "On top of the world right now.",
        "Unexpected good news today.",
        "Feeling really grateful.",
        "High energy, high mood.",
        "Something shifted and it feels great.",
        "Love days like this.",
        "Really present today.",
        "Amazing morning run.",
        "Life is good. Simple as that.",
        "Feeling light, feeling free.",
        "Celebrated a win with people I love.",
        "One of those rare days that just flows.",
        "Radiant. Don't know why, don't care.",
    ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function weightedRandom<T>(pool: [T, number][]): T {
    const total = pool.reduce((sum, [, w]) => sum + w, 0);
    let r = Math.random() * total;
    for (const [item, weight] of pool) {
        r -= weight;
        if (r <= 0) return item;
    }
    return pool[pool.length - 1][0];
}

function pickMood(): number {
    const pool: [number, number][] = MOOD_WEIGHTS.map((w, i) => [i + 1, w]);
    return weightedRandom(pool);
}

function pickCountry(): string {
    return weightedRandom(COUNTRY_POOL);
}

function pickNote(mood: number): string | null {
    if (Math.random() > NOTE_RATE) return null;
    const pool = NOTES[mood];
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Spread votes across the day organically.
 * Uses a log-normal-ish distribution: peaks mid-afternoon UTC (14:00–20:00),
 * tails off at night. We generate a random minute offset within [0, 86400) seconds
 * but weight toward daytime hours.
 */
function pickTimestamp(date: string, index: number, total: number): string {
    // Evenly spread baseline + small random jitter
    const daySeconds = 86400;
    const spacing = daySeconds / total;
    // Start at 00:05 UTC (seed cron runs at 00:05, so votes "happened" throughout yesterday
    // or today — we spread them naturally across the full day window)
    const base = Math.floor(index * spacing) + Math.floor(Math.random() * spacing * 0.8);
    const clampedBase = Math.min(base, daySeconds - 1);

    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day, 0, 0, clampedBase));
    return d.toISOString();
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow ?date=YYYY-MM-DD and ?count=N overrides (useful for backfill)
    const { searchParams } = new URL(request.url);
    const today = new Date().toISOString().split('T')[0];
    const date = searchParams.get('date') ?? today;
    const count = Math.min(parseInt(searchParams.get('count') ?? '80', 10), 500);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    try {
        const rows = Array.from({ length: count }, (_, i) => {
            const mood = pickMood();
            const note = pickNote(mood);
            const country = pickCountry();
            const created_at = pickTimestamp(date, i, count);
            return { mood, note, country, vote_date: date, created_at };
        });

        // Insert in batches of 100 to stay within Supabase limits
        const BATCH = 100;
        let inserted = 0;
        for (let i = 0; i < rows.length; i += BATCH) {
            const batch = rows.slice(i, i + BATCH);
            const { error } = await supabase.from('votes').insert(batch);
            if (error) throw error;
            inserted += batch.length;
        }

        console.log(`[seed] inserted ${inserted} votes for ${date}`);
        return NextResponse.json({ ok: true, date, inserted });
    } catch (err) {
        console.error('[seed] error:', err);
        return NextResponse.json({ error: 'Seed failed', detail: String(err) }, { status: 500 });
    }
}
