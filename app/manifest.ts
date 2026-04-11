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
                src: '/api/pwa-icon?size=192',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/api/pwa-icon?size=512',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    };
}
