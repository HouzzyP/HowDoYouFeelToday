import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'How Do You Feel Today?',
        short_name: 'HDYFT',
        description: 'One question per day. How do you feel today?',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0F6E56',
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    };
}
