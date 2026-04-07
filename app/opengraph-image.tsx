import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'How Do You Feel Today?';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
    // Fetch today's live stats for the OG image
    let avg = 0;
    let total = 0;
    let moodLabel = '';
    let moodColor = '#EF9F27';

    try {
        const baseUrl =
            process.env.NEXT_PUBLIC_SITE_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        const res = await fetch(`${baseUrl}/api/stats`, { next: { revalidate: 60 } });
        if (res.ok) {
            const data = await res.json();
            avg = data.avg ?? 0;
            total = data.total ?? 0;
        }
    } catch {
        // Fallback to neutral state
    }

    const MOODS = [
        { label: 'Awful', color: '#E24B4A' },
        { label: 'Bad',   color: '#D85A30' },
        { label: 'Okay',  color: '#EF9F27' },
        { label: 'Good',  color: '#1D9E75' },
        { label: 'Great', color: '#0F6E56' },
    ];

    if (avg > 0) {
        const idx = Math.max(0, Math.min(4, Math.round(avg) - 1));
        moodLabel = MOODS[idx].label;
        moodColor = MOODS[idx].color;
    }

    return new ImageResponse(
        (
            <div
                style={{
                    width: '1200px',
                    height: '630px',
                    background: '#fafafa',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Georgia, serif',
                    gap: '0px',
                }}
            >
                {/* Top label */}
                <p style={{ fontSize: '18px', color: '#a3a3a3', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '32px', fontFamily: 'sans-serif', fontWeight: 400 }}>
                    HOWDOYOUFEELTODAY
                </p>

                {/* Main heading */}
                <h1 style={{ fontSize: '80px', color: '#171717', fontWeight: 400, lineHeight: 1.05, margin: '0 0 32px 0', textAlign: 'center', maxWidth: '900px' }}>
                    How do you feel today?
                </h1>

                {/* Live mood pill */}
                {avg > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: `${moodColor}18`, border: `1.5px solid ${moodColor}`, borderRadius: '9999px', padding: '14px 36px', marginBottom: '36px' }}>
                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: moodColor }} />
                        <span style={{ fontSize: '28px', color: moodColor, fontFamily: 'sans-serif', fontWeight: 500 }}>
                            {moodLabel} · {avg.toFixed(1)} / 5
                        </span>
                    </div>
                )}

                {/* Vote count */}
                {total >= 50 && (
                    <p style={{ fontSize: '22px', color: '#737373', fontFamily: 'sans-serif', fontWeight: 400, margin: 0 }}>
                        {total.toLocaleString()} voices today
                    </p>
                )}

                {total < 50 && (
                    <p style={{ fontSize: '22px', color: '#737373', fontFamily: 'sans-serif', fontWeight: 400, margin: 0 }}>
                        Anonymous · No login · No tracking
                    </p>
                )}
            </div>
        ),
        { ...size }
    );
}
