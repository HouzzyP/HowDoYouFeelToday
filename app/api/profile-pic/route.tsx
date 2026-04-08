import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/**
 * GET /api/profile-pic
 * Returns a 400x400 PNG suitable for social media profile pictures.
 */
export async function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: '#0F6E56',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* Gauge arc suggestion — three colored dots */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0px',
                    }}
                >
                    {/* Mood arc dots */}
                    <div style={{ display: 'flex', gap: '14px', marginBottom: '28px' }}>
                        {['#E24B4A', '#EF9F27', '#ffffff'].map((color, i) => (
                            <div
                                key={i}
                                style={{
                                    width: i === 2 ? 22 : 14,
                                    height: i === 2 ? 22 : 14,
                                    borderRadius: '50%',
                                    background: color,
                                    opacity: i === 2 ? 1 : 0.7,
                                }}
                            />
                        ))}
                    </div>

                    {/* Needle line */}
                    <div
                        style={{
                            width: '3px',
                            height: '52px',
                            background: '#ffffff',
                            borderRadius: '2px',
                            transform: 'rotate(25deg)',
                            marginBottom: '12px',
                        }}
                    />

                    {/* Pivot dot */}
                    <div
                        style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: '#ffffff',
                        }}
                    />
                </div>
            </div>
        ),
        { width: 400, height: 400 }
    );
}
