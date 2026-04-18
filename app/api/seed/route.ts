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
        // EN
        "Really struggling today.",
        "Everything feels heavy.",
        "Can't shake this feeling.",
        "Just want the day to be over.",
        "Feeling completely drained.",
        "Nothing is going right.",
        "Didn't sleep well. Paying for it now.",
        "Feeling disconnected from everything.",
        "Anxious and tired at the same time.",
        "The world feels a bit too loud today.",
        "Hitting a wall. Can't move forward.",
        "Everything hurts a little today.",
        // ES
        "Hoy fue un día muy duro.",
        "Me siento completamente agotado/a.",
        "No puedo con nada hoy.",
        "Ojalá este día terminara pronto.",
        "Todo se siente muy pesado.",
        "Estoy al límite, sin energía.",
        "Me cuesta hasta respirar hoy.",
        "Nada salió bien. Qué día.",
        // FR
        "Vraiment du mal à tenir aujourd'hui.",
        "Tout semble lourd et difficile.",
        "Je n'arrive pas à me sortir cette sensation.",
        "J'espère que demain sera mieux.",
        "Épuisé(e) sans raison particulière.",
        "Le monde est trop bruyant aujourd'hui.",
        "Rien ne va. Jour à oublier.",
        "Je me sens déconnecté(e) de tout.",
    ],
    2: [
        // EN
        "Not my best day.",
        "Feeling a bit off.",
        "Could be worse, could be better.",
        "Tired and unmotivated.",
        "Headache that won't go away.",
        "Just going through the motions.",
        "Hard to focus on anything.",
        "Overthinking everything today.",
        "Feels like I'm running on empty.",
        "A bit sad, no particular reason.",
        "Things feel uncertain right now.",
        "Dragging myself through the day.",
        // ES
        "No es mi mejor día que digamos.",
        "Me siento un poco desanimado/a.",
        "Podría estar mejor, la verdad.",
        "Cansado/a y sin muchas ganas.",
        "Jornada difícil, mucho estrés.",
        "Me cuesta concentrarme en algo.",
        "Pensando demasiado en todo.",
        "Un poco triste, sin razón clara.",
        // FR
        "Pas mon meilleur jour.",
        "Je me sens un peu à côté.",
        "Fatigué(e) et sans motivation.",
        "Difficile de se concentrer.",
        "Je ressasse trop de choses.",
        "Un peu triste, sans raison précise.",
        "Journée compliquée, beaucoup de stress.",
        "Je tourne en rond aujourd'hui.",
    ],
    3: [
        // EN
        "Normal day, nothing special.",
        "Getting through it.",
        "Neutral. Could go either way.",
        "Fine, I guess.",
        "Busy but managing.",
        "Not bad, not great.",
        "Took it one step at a time.",
        "Nothing exciting, but stable.",
        "Kept my head above water.",
        "Productive but a bit flat.",
        "Somewhere in the middle.",
        "Functional. That counts.",
        // ES
        "Un día normal, sin más.",
        "Tirando, como siempre.",
        "Ni bien ni mal, la verdad.",
        "Estuve ocupado/a pero lo manejé.",
        "Un día tranquilo, sin novedades.",
        "Nada especial, pero estable.",
        "Sobreviví otro lunes.",
        "Regular. Mañana será mejor.",
        // FR
        "Journée normale, rien de spécial.",
        "On s'en sort.",
        "Ni bien ni mal, quelque part au milieu.",
        "Occupé(e) mais ça va.",
        "Rien d'excitant, mais stable.",
        "Journée productive mais un peu plate.",
        "On fait ce qu'on peut.",
        "Ça pourrait aller dans les deux sens.",
    ],
    4: [
        // EN
        "Had a nice moment this morning.",
        "Good energy today.",
        "Grateful for small things.",
        "Coffee was perfect. Good start.",
        "Felt connected to people today.",
        "Laughed a lot today.",
        "Feeling more like myself.",
        "Good conversation with a friend.",
        "The weather helped my mood.",
        "Feeling settled and calm.",
        "Nice day overall.",
        "Found some peace in the chaos.",
        // ES
        "Tuve un lindo momento esta mañana.",
        "Buena energía hoy, la verdad.",
        "Agradecido/a por las cosas pequeñas.",
        "El café estuvo perfecto. Buen comienzo.",
        "Me sentí conectado/a con la gente hoy.",
        "Me reí bastante hoy.",
        "Me siento más yo mismo/a.",
        "El clima ayudó mucho al humor.",
        // FR
        "J'ai eu un beau moment ce matin.",
        "Bonne énergie aujourd'hui.",
        "Reconnaissant(e) pour les petites choses.",
        "Le café était parfait. Bon début.",
        "Je me suis senti(e) connecté(e) aux autres.",
        "J'ai beaucoup ri aujourd'hui.",
        "Je me sens plus moi-même.",
        "Le temps m'a aidé à me sentir mieux.",
    ],
    5: [
        // EN
        "Genuinely happy today.",
        "Best day in a while.",
        "Everything clicked.",
        "Feeling alive.",
        "Unexpected good news today.",
        "Feeling really grateful.",
        "High energy, high mood.",
        "Love days like this.",
        "Really present today.",
        "Life is good. Simple as that.",
        "Feeling light, feeling free.",
        "One of those rare days that just flows.",
        // ES
        "Genuinamente feliz hoy.",
        "El mejor día en mucho tiempo.",
        "Todo encajó perfecto hoy.",
        "Buenas noticias que no esperaba.",
        "Me siento muy agradecido/a.",
        "Energía altísima, humor excelente.",
        "Me siento vivo/a de verdad.",
        "Días así son los que valen.",
        // FR
        "Vraiment heureux/heureuse aujourd'hui.",
        "Meilleure journée depuis longtemps.",
        "Tout s'est mis en place parfaitement.",
        "Bonne nouvelle inattendue aujourd'hui.",
        "Je me sens vraiment reconnaissant(e).",
        "Plein(e) d'énergie et de bonne humeur.",
        "Des jours comme ça, c'est la vie.",
        "Légèreté et liberté aujourd'hui.",
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

function makeNotePicker() {
    const used = new Set<string>();
    return function pickNote(mood: number): string | null {
        if (Math.random() > NOTE_RATE) return null;
        const pool = NOTES[mood];
        const available = pool.filter((n) => !used.has(n));
        if (available.length === 0) return null; // all notes for this mood exhausted
        const note = available[Math.floor(Math.random() * available.length)];
        used.add(note);
        return note;
    };
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
        const pickNote = makeNotePicker();
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
