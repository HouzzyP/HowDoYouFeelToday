import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    const sub = await req.json();

    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
        return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
        {
            endpoint: sub.endpoint,
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
        },
        { onConflict: 'endpoint' }
    );

    if (error) {
        return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
    const { endpoint } = await req.json();

    if (!endpoint) {
        return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    return NextResponse.json({ ok: true });
}
