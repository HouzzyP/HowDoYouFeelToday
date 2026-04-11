import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: 180,
                    height: 180,
                    borderRadius: 40,
                    background: '#0F6E56',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        border: '12px solid #ffffff',
                        display: 'flex',
                    }}
                />
            </div>
        ),
        { ...size }
    );
}
