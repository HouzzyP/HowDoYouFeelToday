import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function GET(req: NextRequest) {
    // Vercel Cron authenticates with CRON_SECRET automatically
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all subscriptions
    const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth');

    if (subError || !subscriptions || subscriptions.length === 0) {
        return NextResponse.json({ sent: 0, total: 0 });
    }

    // Build notification content
    // On Sundays: weekly summary with yesterday's global avg
    const today = new Date();
    const isWeeklySummary = today.getDay() === 0;

    let title = 'How do you feel today?';
    let body = 'Take a second to check in. The world is listening.';

    if (isWeeklySummary) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yDate = yesterday.toISOString().split('T')[0];

        const { data: stats } = await supabase.rpc('get_stats', { p_date: yDate });
        if (stats?.avg > 0) {
            body = `This week the world averaged ${Number(stats.avg).toFixed(1)}/5. How are you feeling today?`;
            title = 'Weekly mood recap';
        }
    }

    const payload = JSON.stringify({ title, body, url: '/' });

    // Send to all subscriptions, clean up expired ones
    const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    payload
                );
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabase
                        .from('push_subscriptions')
                        .delete()
                        .eq('endpoint', sub.endpoint);
                }
                throw err;
            }
        })
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return NextResponse.json({ sent, total: subscriptions.length });
}
