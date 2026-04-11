import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

const MOODS = ['Awful', 'Bad', 'Okay', 'Good', 'Great'];
const MOOD_EMOJI = ['😔', '😕', '😐', '🙂', '😊'];
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://howdoyoufeeltoday.today';

function moodIndex(avg: number) {
    return Math.max(0, Math.min(4, Math.round(avg) - 1));
}

function composeTweet(mood: string, emoji: string, avg: string, total: number, date: string): string {
    const templates = [
        `The world feels ${mood} today ${emoji}\n\n${avg}/5 average · ${total.toLocaleString()} voices\n\nHow do you feel? → ${SITE_URL}`,
        `${date} world mood: ${mood} ${emoji}\n\n${avg}/5 · ${total.toLocaleString()} people shared how they feel today\n\n→ ${SITE_URL}`,
        `Today the world feels ${mood} ${emoji}\n\nAverage: ${avg}/5 across ${total.toLocaleString()} anonymous voices.\n\nWhat about you? ${SITE_URL}`,
    ];
    // Rotate template by day of month for variety
    const day = new Date().getUTCDate();
    return templates[day % templates.length];
}

export async function GET(req: NextRequest) {
    // Auth — same CRON_SECRET used by push/send
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch today's stats
    const today = new Date().toISOString().split('T')[0];
    const { data: stats, error } = await supabase.rpc('get_stats', { p_date: today });

    if (error || !stats) {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    if (!stats.total || stats.total < 10) {
        return NextResponse.json({ skipped: true, reason: 'Not enough votes yet' });
    }

    const avg = Number(stats.avg).toFixed(1);
    const idx = moodIndex(Number(stats.avg));
    const mood = MOODS[idx];
    const emoji = MOOD_EMOJI[idx];
    const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });

    const tweet = composeTweet(mood, emoji, avg, stats.total, date);

    // Post to Twitter
    const client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY!,
        appSecret: process.env.TWITTER_API_SECRET!,
        accessToken: process.env.TWITTER_ACCESS_TOKEN!,
        accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
    });

    try {
        const { data } = await client.v2.tweet(tweet);
        return NextResponse.json({ ok: true, tweetId: data.id, tweet });
    } catch (err: any) {
        console.error('Twitter post failed:', err);
        return NextResponse.json({ error: 'Failed to post tweet', detail: err.message }, { status: 500 });
    }
}
