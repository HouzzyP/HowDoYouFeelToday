import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { voteRatelimit } from '@/lib/ratelimit';

const NOTE_MAX_CHARS = 280;

export async function POST(request: NextRequest) {
    // Rate limiting — 3 votes per IP per 24h window
    if (voteRatelimit) {
        const ip =
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1';

        const { success, limit, remaining } = await voteRatelimit.limit(ip);

        if (!success) {
            return NextResponse.json(
                { message: 'Too many votes. Try again tomorrow.' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': String(limit),
                        'X-RateLimit-Remaining': String(remaining),
                    },
                }
            );
        }
    }

    try {
        const body = await request.json();
        const { mood, note, country } = body;

        // Validate mood
        if (!mood || !Number.isInteger(mood) || mood < 1 || mood > 5) {
            return NextResponse.json(
                { message: 'Invalid mood. Must be an integer between 1 and 5.' },
                { status: 400 }
            );
        }

        // Validate note
        if (note && (typeof note !== 'string' || note.length > NOTE_MAX_CHARS)) {
            return NextResponse.json(
                { message: `Note too long. Maximum ${NOTE_MAX_CHARS} characters.` },
                { status: 400 }
            );
        }

        // Validate country
        if (country && (typeof country !== 'string' || country.length !== 2 || !/^[A-Z]{2}$/.test(country))) {
            return NextResponse.json(
                { message: 'Invalid country code. Must be 2-character uppercase ISO code.' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('votes')
            .insert([
                {
                    mood,
                    note: note && note.trim() ? note.trim() : null,
                    country: country || null,
                    vote_date: new Date().toISOString().split('T')[0],
                },
            ]);

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json(
                { message: 'Failed to record vote' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('Vote API error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
