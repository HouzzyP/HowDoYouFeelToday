import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const raw = req.nextUrl.searchParams.get('size');
    const size = raw === '512' ? 512 : 192;
    const radius = Math.round(size * 0.22);
    const circleSize = Math.round(size * 0.44);
    const border = Math.round(size * 0.065);

    return new ImageResponse(
        (
            <div
                style={{
                    width: size,
                    height: size,
                    borderRadius: radius,
                    background: '#0F6E56',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        width: circleSize,
                        height: circleSize,
                        borderRadius: '50%',
                        border: `${border}px solid #ffffff`,
                    }}
                />
            </div>
        ),
        { width: size, height: size }
    );
}
