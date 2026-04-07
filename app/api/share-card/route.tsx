import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const MOODS = [
    { label: 'Awful', color: '#E24B4A', bg: '#FCEBEB' },
    { label: 'Bad',   color: '#D85A30', bg: '#FAECE7' },
    { label: 'Okay',  color: '#EF9F27', bg: '#FAEEDA' },
    { label: 'Good',  color: '#1D9E75', bg: '#E1F5EE' },
    { label: 'Great', color: '#0F6E56', bg: '#E1F5EE' },
];

/**
 * GET /api/share-card?mood=4&avg=3.7&total=1234&date=2026-04-05
 *
 * Returns a 1080x1080 PNG card the user can save/share as a story.
 * mood: 1-5 (user's personal mood)
 * avg: global average (float)
 * total: total votes (shown only if >= 50)
 * date: YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    const moodParam = parseInt(searchParams.get('mood') || '0', 10);
    const avg = parseFloat(searchParams.get('avg') || '0');
    const total = parseInt(searchParams.get('total') || '0', 10);
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!moodParam || moodParam < 1 || moodParam > 5) {
        return NextResponse.json({ message: 'Invalid mood param' }, { status: 400 });
    }

    const mood = MOODS[moodParam - 1];
    const worldMoodIdx = avg > 0 ? Math.max(0, Math.min(4, Math.round(avg) - 1)) : null;
    const worldMood = worldMoodIdx !== null ? MOODS[worldMoodIdx] : null;

    const formattedDate = new Date(dateParam + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    const showTotal = total >= 50;

    const image = new ImageResponse(
        (
            <div
                style={{
                    width: '1080px',
                    height: '1080px',
                    background: mood.bg,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '80px',
                    gap: '0px',
                }}
            >
                {/* Top label */}
                <p style={{ fontSize: '20px', color: '#a3a3a3', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 400, margin: '0 0 48px 0' }}>
                    HOWDOYOUFEELTODAY
                </p>

                {/* Date */}
                <p style={{ fontSize: '24px', color: '#737373', fontFamily: 'sans-serif', fontWeight: 400, margin: '0 0 40px 0' }}>
                    {formattedDate}
                </p>

                {/* User mood */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: mood.color }} />
                    <span style={{ fontSize: '88px', color: mood.color, fontFamily: 'Georgia, serif', fontWeight: 400, lineHeight: 1 }}>
                        {mood.label}
                    </span>
                </div>

                <p style={{ fontSize: '26px', color: '#737373', fontFamily: 'sans-serif', fontWeight: 400, margin: '0 0 64px 0' }}>
                    That&apos;s how I felt today
                </p>

                {/* Divider */}
                <div style={{ width: '80px', height: '1px', background: '#d4d4d4', marginBottom: '48px' }} />

                {/* World mood */}
                {worldMood && avg > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <p style={{ fontSize: '20px', color: '#a3a3a3', fontFamily: 'sans-serif', fontWeight: 400, margin: 0 }}>
                            The world felt
                        </p>
                        <p style={{ fontSize: '44px', color: worldMood.color, fontFamily: 'Georgia, serif', fontWeight: 400, margin: 0 }}>
                            {worldMood.label} · {avg.toFixed(1)} / 5
                        </p>
                        {showTotal && (
                            <p style={{ fontSize: '18px', color: '#a3a3a3', fontFamily: 'sans-serif', fontWeight: 400, margin: 0 }}>
                                {total.toLocaleString()} voices
                            </p>
                        )}
                    </div>
                )}
            </div>
        ),
        { width: 1080, height: 1080 }
    );

    // ImageResponse extends Response — return it directly, do not wrap in NextResponse
    return image;
}
