import type { Metadata } from 'next';
import './globals.css';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata: Metadata = {
    title: 'How Do You Feel Today?',
    description:
        'A daily global mood check. One tap. See how the world feels right now.',
    openGraph: {
        title: 'How Do You Feel Today?',
        description:
            'Join thousands sharing how they feel. See the world mood in real time.',
    },
    twitter: {
        card: 'summary_large_image',
    },
};

// Injected before React hydrates to avoid flash of wrong theme.
// Reads localStorage and adds .dark to <html> immediately if needed.
const antiFOUC = `(function(){try{var t=localStorage.getItem('hdf_theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t!=='light'&&d)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: antiFOUC }} />
            </head>
            <body className="bg-white text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
                <ThemeToggle />
                {children}
            </body>
        </html>
    );
}
