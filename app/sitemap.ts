import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const base = 'https://howdoyoufeeltoday.today';
    const today = new Date().toISOString().split('T')[0];

    return [
        {
            url: base,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${base}/archive/${today}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.5,
        },
    ];
}
