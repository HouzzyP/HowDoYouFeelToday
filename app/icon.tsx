import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#0F6E56',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        border: '2.5px solid #ffffff',
                        display: 'flex',
                    }}
                />
            </div>
        ),
        { ...size }
    );
}
