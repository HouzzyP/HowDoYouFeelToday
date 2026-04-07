'use client';

import { useEffect, useState } from 'react';

export type Theme = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'hdf_theme';

function resolveIsDark(theme: Theme): boolean {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return theme === 'dark' || (theme === 'system' && prefersDark);
}

function applyTheme(theme: Theme) {
    document.documentElement.classList.toggle('dark', resolveIsDark(theme));
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>('system');
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        const initial: Theme =
            stored === 'light' || stored === 'dark' || stored === 'system'
                ? stored
                : 'system';

        setTheme(initial);
        setIsDark(resolveIsDark(initial));

        // Keep in sync when the OS preference changes (only matters in 'system' mode)
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            const current = (localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
            if (current === 'system') {
                setIsDark(e.matches);
                document.documentElement.classList.toggle('dark', e.matches);
            }
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const cycleTheme = () => {
        // Auto → Light → Dark → Auto
        const next: Theme =
            theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
        setTheme(next);
        setIsDark(resolveIsDark(next));
    };

    return { theme, isDark, cycleTheme };
}
