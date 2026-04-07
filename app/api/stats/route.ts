import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/stats
 * GET /api/stats?date=YYYY-MM-DD
 * GET /api/stats?date=YYYY-MM-DD&country=AR
 *
 * Delegates all aggregation to Postgres RPCs — zero JS math, single DB round-trip.
 *
 * Response shape:
 * {
 *   total:   number,
 *   avg:     number,
 *   counts:  [awful, bad, okay, good, great],
 *   notes:   [{ mood, note, country, created_at }],
 *   history: [{ date, avg, total }]   ← last 30 days (global, not country-filtered)
 * }
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const dateParam = searchParams.get('date');
    const countryParam = searchParams.get('country');
    const today = new Date().toISOString().split('T')[0];

    const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
    const targetDate =
        dateParam && ISO_DATE.test(dateParam) && dateParam <= today
            ? dateParam
            : today;

    // Validate country: 2-char uppercase ISO only
    const country =
        countryParam && /^[A-Z]{2}$/.test(countryParam.toUpperCase())
            ? countryParam.toUpperCase()
            : null;

    const isToday = targetDate === today;

    let data: unknown;
    let error: unknown;

    if (country) {
        // Country-filtered stats — requires get_stats_by_country RPC (see CLAUDE.md)
        ({ data, error } = await supabase.rpc('get_stats_by_country', {
            p_date: targetDate,
            p_country: country,
        }));
    } else {
        ({ data, error } = await supabase.rpc('get_stats', { p_date: targetDate }));
    }

    if (error) {
        console.error('Stats RPC error:', error);
        return NextResponse.json({ message: 'Failed to fetch stats' }, { status: 500 });
    }

    const cacheMaxAge = isToday ? 60 : 3600;

    return NextResponse.json(data, {
        status: 200,
        headers: {
            'Cache-Control': `public, max-age=${cacheMaxAge}`,
            'Content-Type': 'application/json',
        },
    });
}
